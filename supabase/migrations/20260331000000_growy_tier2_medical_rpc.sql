-- ============================================================
-- Growy Tier 2: Medical & Dispensary RPC Expansion
-- ============================================================

-- 1. Create Audit Log Table
CREATE TABLE IF NOT EXISTS growy_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID REFERENCES profiles(id),
    prompt TEXT,
    action_count INT DEFAULT 0,
    actions JSONB,
    result TEXT, -- 'success' | 'error' | 'cancelled'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick org-level queries
CREATE INDEX IF NOT EXISTS idx_growy_audit_org ON growy_audit_log(organization_id, created_at DESC);

-- RLS: Users can only see their own org's audit logs
ALTER TABLE growy_audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'growy_audit_log'
      AND policyname = 'Users can view their org audit logs'
  ) THEN
    CREATE POLICY "Users can view their org audit logs"
    ON growy_audit_log FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));
  END IF;
END $$;

-- ============================================================
-- 2. Replace execute_growy_batch with ALL 15 action handlers
-- ============================================================

CREATE OR REPLACE FUNCTION execute_growy_batch(
    p_org_id UUID,
    p_profile_id UUID,
    p_actions JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_action JSONB;
    v_action_name TEXT;
    v_args JSONB;
    v_resolved_ids JSONB := '{}'::JSONB;
    v_temp_id UUID;
    v_temp_ref TEXT;
    
    -- Variables para referencias cruzadas
    v_spot_id UUID;
    v_spot_id_ref TEXT;
    v_room_id UUID;
    v_room_id_ref TEXT;
    v_batch_id UUID;
    v_batch_id_ref TEXT;
    
    v_action_count INT := 0;
BEGIN
    FOR v_action IN SELECT * FROM jsonb_array_elements(p_actions)
    LOOP
        v_action_name := v_action->>'name';
        v_args := v_action->'args';
        v_action_count := v_action_count + 1;
        
        -- Verificar si esta acción propone un ID temporal de referencia
        v_temp_ref := v_args->>'id';

        -------------------------------------------------------------
        -- 1. create_crop
        -------------------------------------------------------------
        IF v_action_name = 'create_crop' THEN
            INSERT INTO chakra_crops (
                organization_id, name, location, start_date, 
                estimated_harvest_date, status, color
            )
            VALUES (
                p_org_id,
                v_args->>'name',
                v_args->>'location',
                COALESCE((v_args->>'startDate')::DATE, CURRENT_DATE),
                (v_args->>'estimatedHarvestDate')::DATE,
                'active',
                COALESCE(v_args->>'color', 'green')
            )
            RETURNING id INTO v_temp_id;

        -------------------------------------------------------------
        -- 2. update_crop
        -------------------------------------------------------------
        ELSIF v_action_name = 'update_crop' THEN
            UPDATE chakra_crops
            SET
                name = COALESCE(v_args->>'name', name),
                status = COALESCE(v_args->>'status', status),
                location = COALESCE(v_args->>'location', location),
                updated_at = NOW()
            WHERE id = (v_args->>'id')::UUID
              AND organization_id = p_org_id;
            
            v_temp_id := (v_args->>'id')::UUID;

        -------------------------------------------------------------
        -- 3. delete_crop (solo si vacío)
        -------------------------------------------------------------
        ELSIF v_action_name = 'delete_crop' THEN
            -- Verificar que no tenga salas activas
            IF EXISTS (
                SELECT 1 FROM rooms 
                WHERE spot_id = (v_args->>'id')::UUID 
                LIMIT 1
            ) THEN
                RAISE EXCEPTION 'No se puede eliminar el cultivo porque tiene salas activas. Elimina las salas primero.';
            END IF;
            
            DELETE FROM chakra_crops
            WHERE id = (v_args->>'id')::UUID
              AND organization_id = p_org_id;
            
            v_temp_id := (v_args->>'id')::UUID;

        -------------------------------------------------------------
        -- 4. log_harvest
        -------------------------------------------------------------
        ELSIF v_action_name = 'log_harvest' THEN
            -- Resolver cropId
            v_spot_id_ref := v_args->>'cropId';
            IF v_spot_id_ref IS NOT NULL AND v_resolved_ids ? v_spot_id_ref THEN
                v_spot_id := (v_resolved_ids->>v_spot_id_ref)::UUID;
            ELSIF v_spot_id_ref IS NOT NULL THEN
                v_spot_id := v_spot_id_ref::UUID;
            END IF;

            INSERT INTO batch_movements (
                batch_id, notes, created_by, moved_at
            )
            VALUES (
                NULL, -- No specific batch, log at harvest level
                'Cosecha registrada por Growy: ' || 
                    COALESCE(v_args->>'amount', '0') || ' ' || 
                    COALESCE(v_args->>'unit', 'g') || 
                    ' en sala ' || COALESCE(v_args->>'roomName', 'N/A') ||
                    COALESCE(' - ' || v_args->>'notes', ''),
                p_profile_id,
                NOW()
            )
            RETURNING id INTO v_temp_id;

        -------------------------------------------------------------
        -- 5. create_room
        -------------------------------------------------------------
        ELSIF v_action_name = 'create_room' THEN
            -- Resolver spotId
            v_spot_id_ref := COALESCE(v_args->>'spotId', v_args->>'crop_id');
            IF v_spot_id_ref IS NOT NULL THEN
                IF v_resolved_ids ? v_spot_id_ref THEN
                    v_spot_id := (v_resolved_ids->>v_spot_id_ref)::UUID;
                ELSE
                    v_spot_id := v_spot_id_ref::UUID;
                END IF;
            END IF;

            INSERT INTO rooms (
                organization_id, name, type, capacity, spot_id
            )
            VALUES (
                p_org_id,
                v_args->>'name',
                v_args->>'type',
                COALESCE((v_args->>'capacity')::INT, 100),
                v_spot_id
            )
            RETURNING id INTO v_temp_id;

        -------------------------------------------------------------
        -- 6. create_batch
        -------------------------------------------------------------
        ELSIF v_action_name = 'create_batch' THEN
            -- Resolver roomId
            v_room_id_ref := v_args->>'roomId';
            IF v_room_id_ref IS NOT NULL THEN
                IF v_resolved_ids ? v_room_id_ref THEN
                    v_room_id := (v_resolved_ids->>v_room_id_ref)::UUID;
                ELSE
                    v_room_id := v_room_id_ref::UUID;
                END IF;
            END IF;

            -- Resolver geneticId: puede ser UUID directo o nombre de genética
            DECLARE
                v_genetic_id UUID;
                v_genetic_ref TEXT := v_args->>'geneticId';
            BEGIN
                IF v_genetic_ref IS NOT NULL AND v_genetic_ref != '' THEN
                    -- Intentar parsear como UUID
                    BEGIN
                        v_genetic_id := v_genetic_ref::UUID;
                    EXCEPTION WHEN OTHERS THEN
                        -- No es UUID, buscar por nombre (case-insensitive)
                        SELECT id INTO v_genetic_id
                        FROM genetics
                        WHERE organization_id = p_org_id
                          AND LOWER(name) = LOWER(v_genetic_ref)
                        LIMIT 1;
                    END;
                END IF;

                INSERT INTO batches (
                    organization_id, name, quantity, stage,
                    genetic_id, current_room_id, start_date
                )
                VALUES (
                    p_org_id,
                    COALESCE(v_args->>'name', 'Lote Growy'),
                    COALESCE((v_args->>'count')::INT, 1),
                    COALESCE(v_args->>'stage', 'seedling'),
                    v_genetic_id,
                    v_room_id,
                    COALESCE((v_args->>'startDate')::DATE, CURRENT_DATE)
                )
                RETURNING id INTO v_temp_id;

                -- Log movement
                INSERT INTO batch_movements (batch_id, to_room_id, notes, created_by)
                VALUES (v_temp_id, v_room_id, 'Creación de Lote (Growy AI)', p_profile_id);
            END;

        -------------------------------------------------------------
        -- 7. move_batch
        -------------------------------------------------------------
        ELSIF v_action_name = 'move_batch' THEN
            v_batch_id := (v_args->>'batchId')::UUID;
            v_room_id := (v_args->>'destinationRoomId')::UUID;

            -- Get current room for logging
            SELECT current_room_id INTO v_spot_id
            FROM batches WHERE id = v_batch_id;

            UPDATE batches
            SET current_room_id = v_room_id
            WHERE id = v_batch_id
              AND organization_id = p_org_id;

            -- Log movement
            INSERT INTO batch_movements (batch_id, from_room_id, to_room_id, notes, created_by)
            VALUES (v_batch_id, v_spot_id, v_room_id, 'Movimiento de sala (Growy AI)', p_profile_id);

            v_temp_id := v_batch_id;

        -------------------------------------------------------------
        -- 8. create_task
        -------------------------------------------------------------
        ELSIF v_action_name = 'create_task' THEN
            -- Resolver crop_id/spotId
            v_spot_id_ref := COALESCE(v_args->>'crop_id', v_args->>'spotId');
            IF v_spot_id_ref IS NOT NULL THEN
                IF v_resolved_ids ? v_spot_id_ref THEN
                    v_spot_id := (v_resolved_ids->>v_spot_id_ref)::UUID;
                ELSE
                    v_spot_id := v_spot_id_ref::UUID;
                END IF;
            END IF;

            -- Resolver roomId
            v_room_id_ref := v_args->>'roomId';
            IF v_room_id_ref IS NOT NULL THEN
                IF v_resolved_ids ? v_room_id_ref THEN
                    v_room_id := (v_resolved_ids->>v_room_id_ref)::UUID;
                ELSE
                    v_room_id := v_room_id_ref::UUID;
                END IF;
            END IF;

            INSERT INTO chakra_tasks (
                organization_id, title, description, type,
                due_date, status, assigned_to, crop_id, room_id, recurrence
            )
            VALUES (
                p_org_id,
                v_args->>'title',
                COALESCE(v_args->>'description', ''),
                COALESCE(v_args->>'type', 'other'),
                COALESCE((v_args->>'dueDate')::TIMESTAMPTZ, NOW()),
                'pending',
                NULLIF(v_args->>'assigned_toUserId', '')::UUID,
                v_spot_id,
                v_room_id,
                v_args->'recurrence'
            )
            RETURNING id INTO v_temp_id;

        -------------------------------------------------------------
        -- 9. toggle_task_completion
        -------------------------------------------------------------
        ELSIF v_action_name = 'toggle_task_completion' THEN
            UPDATE chakra_tasks
            SET status = CASE 
                WHEN status = 'completed' THEN 'pending'
                WHEN status = 'done' THEN 'pending'
                ELSE 'completed'
            END,
            updated_at = NOW()
            WHERE id = (v_args->>'taskId')::UUID
              AND organization_id = p_org_id;
            
            v_temp_id := (v_args->>'taskId')::UUID;

        -------------------------------------------------------------
        -- 10. create_room_sticky (Notas de Sala/Pizarra)
        -------------------------------------------------------------
        ELSIF v_action_name = 'create_room_sticky' THEN
            -- Resolver roomId
            v_room_id_ref := v_args->>'roomId';
            IF v_room_id_ref IS NOT NULL THEN
                IF v_resolved_ids ? v_room_id_ref THEN
                    v_room_id := (v_resolved_ids->>v_room_id_ref)::UUID;
                ELSE
                    v_room_id := v_room_id_ref::UUID;
                END IF;
            END IF;

            INSERT INTO chakra_stickies (
                organization_id, content, color, room_id, user_id, created_by
            )
            VALUES (
                p_org_id,
                v_args->>'content',
                COALESCE(v_args->>'color', 'yellow'),
                v_room_id,
                p_profile_id,
                'Growy AI'
            )
            RETURNING id INTO v_temp_id;

        -------------------------------------------------------------
        -- 11. create_map (Clone Map / Mesa de trabajo)
        -------------------------------------------------------------
        ELSIF v_action_name = 'create_map' THEN
            -- Resolver roomId
            v_room_id_ref := v_args->>'roomId';
            IF v_room_id_ref IS NOT NULL THEN
                IF v_resolved_ids ? v_room_id_ref THEN
                    v_room_id := (v_resolved_ids->>v_room_id_ref)::UUID;
                ELSE
                    v_room_id := v_room_id_ref::UUID;
                END IF;
            END IF;

            INSERT INTO clone_maps (
                organization_id, name, room_id, grid_rows, grid_columns
            )
            VALUES (
                p_org_id,
                v_args->>'name',
                v_room_id,
                COALESCE((v_args->>'grid_rows')::INT, 5),
                COALESCE((v_args->>'grid_columns')::INT, 5)
            )
            RETURNING id INTO v_temp_id;

        -------------------------------------------------------------
        -- 12. create_expense (Movimiento financiero)
        -------------------------------------------------------------
        ELSIF v_action_name = 'create_expense' THEN
            INSERT INTO chakra_expenses (
                organization_id, concept, amount, type, 
                category, date, payment_method
            )
            VALUES (
                p_org_id,
                v_args->>'title',
                COALESCE((v_args->>'amount')::NUMERIC, 0),
                COALESCE(v_args->>'type', 'EGRESO'),
                COALESCE(v_args->>'category', 'other'),
                COALESCE((v_args->>'date')::DATE, CURRENT_DATE),
                COALESCE(v_args->>'payment_method', 'Efectivo')
            )
            RETURNING id INTO v_temp_id;

        -------------------------------------------------------------
        -- 13. create_insumo (Stock/Inventario)
        -------------------------------------------------------------
        ELSIF v_action_name = 'create_insumo' THEN
            INSERT INTO chakra_stock_items (
                organization_id, nombre, categoria, 
                unit_of_measurement, precio_unitario,
                stock_actual, stock_minimo
            )
            VALUES (
                p_org_id,
                v_args->>'nombre',
                COALESCE(v_args->>'categoria', 'otros'),
                COALESCE(v_args->>'unidad_medida', 'unidades'),
                COALESCE((v_args->>'precio_actual')::NUMERIC, 0),
                COALESCE((v_args->>'stock_actual')::NUMERIC, 0),
                COALESCE((v_args->>'stock_minimo')::NUMERIC, 0)
            )
            RETURNING id INTO v_temp_id;

        -------------------------------------------------------------
        -- 14. create_patient (Alta de paciente simplificada)
        -------------------------------------------------------------
        ELSIF v_action_name = 'create_patient' THEN
            -- Nota: create_patient simplificado solo inserta en aurora_patients
            -- sin crear un Auth User. Requiere un profile_id existente o crea un registro mínimo.
            INSERT INTO aurora_patients (
                organization_id, reprocann_number,
                reprocann_status, notes, monthly_limit
            )
            VALUES (
                p_org_id,
                COALESCE(v_args->>'reprocannNumber', ''),
                'pending',
                COALESCE(v_args->>'notes', ''),
                40
            )
            RETURNING id INTO v_temp_id;

        -------------------------------------------------------------
        -- 15. create_sticky (Dashboard global)
        -------------------------------------------------------------
        ELSIF v_action_name = 'create_sticky' THEN
            INSERT INTO chakra_stickies (
                organization_id, content, color, user_id, created_by
            )
            VALUES (
                p_org_id,
                v_args->>'content',
                COALESCE(v_args->>'color', 'yellow'),
                p_profile_id,
                'Growy AI'
            )
            RETURNING id INTO v_temp_id;

        -------------------------------------------------------------
        -- 16. create_medical_evolution (Registro Clínico)
        -------------------------------------------------------------
        ELSIF v_action_name = 'create_medical_evolution' THEN
            -- Necesitamos encontrar la admission_id correspondiente al patientId.
            DECLARE
                v_patient_id UUID := (v_args->>'patientId')::UUID;
                v_admission_id UUID;
            BEGIN
                SELECT id INTO v_admission_id
                FROM clinical_admissions
                WHERE patient_id = v_patient_id AND organization_id = p_org_id
                ORDER BY created_at DESC LIMIT 1;

                IF v_admission_id IS NULL THEN
                    RAISE EXCEPTION 'El paciente no tiene una admisión clínica activa. Debe ser admitido primero.';
                END IF;

                INSERT INTO clinical_evolutions (
                    organization_id, admission_id, title, date, eva_score, 
                    notes, next_follow_up_months
                )
                VALUES (
                    p_org_id,
                    v_admission_id,
                    v_args->>'title',
                    CURRENT_DATE,
                    (v_args->>'eva_score')::INT,
                    v_args->>'notes',
                    COALESCE((v_args->>'next_follow_up_months')::INT, 6)
                )
                RETURNING id INTO v_temp_id;
            END;

        -------------------------------------------------------------
        -- 17. dispense_stock (Dispensario)
        -------------------------------------------------------------
        ELSIF v_action_name = 'dispense_stock' THEN
            DECLARE
                v_dispensary_batch_id UUID := (v_args->>'batchId')::UUID;
                v_patient_id UUID := (v_args->>'patientId')::UUID;
                v_amount NUMERIC := (v_args->>'amount')::NUMERIC;
                v_current_weight NUMERIC;
                v_new_weight NUMERIC;
            BEGIN
                -- Verificar stock
                SELECT current_weight INTO v_current_weight
                FROM chakra_dispensary_batches
                WHERE id = v_dispensary_batch_id AND organization_id = p_org_id;

                IF v_current_weight IS NULL THEN
                    RAISE EXCEPTION 'Lote de dispensario no encontrado.';
                END IF;

                IF v_current_weight < v_amount THEN
                    RAISE EXCEPTION 'Stock insuficiente en el dispensario.';
                END IF;

                v_new_weight := v_current_weight - v_amount;

                -- Actualizar lote
                UPDATE chakra_dispensary_batches
                SET current_weight = v_new_weight,
                    status = CASE WHEN v_new_weight <= 0 THEN 'depleted' ELSE status END
                WHERE id = v_dispensary_batch_id;

                -- Registrar movimiento (dispense)
                INSERT INTO chakra_dispensary_movements (
                    batch_id, type, amount, reason, performed_by, member_id, 
                    previous_weight, new_weight, transaction_value
                )
                VALUES (
                    v_dispensary_batch_id, 
                    'dispense', 
                    -v_amount, 
                    COALESCE(v_args->>'reason', 'Growy Dispense'), 
                    p_profile_id, 
                    v_patient_id, 
                    v_current_weight, 
                    v_new_weight,
                    COALESCE((v_args->>'transaction_value')::NUMERIC, 0)
                )
                RETURNING id INTO v_temp_id;
            END;

        ELSE
            RAISE EXCEPTION 'Acción Growy no soportada en el lote: %', v_action_name;
        END IF;

        -- Registrar mapeo temporal
        IF v_temp_ref IS NOT NULL AND v_temp_id IS NOT NULL THEN
            v_resolved_ids := jsonb_set(v_resolved_ids, array[v_temp_ref], to_jsonb(v_temp_id::TEXT));
        END IF;

        -- Limpiar IDs iterativos
        v_spot_id := NULL;
        v_room_id := NULL;
        v_batch_id := NULL;
        v_temp_ref := NULL;

    END LOOP;

    -- Audit log (éxito)
    INSERT INTO growy_audit_log (
        organization_id, user_id, action_count, actions, result
    )
    VALUES (
        p_org_id, p_profile_id, v_action_count, p_actions, 'success'
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Lote Growy ejecutado exitosamente',
        'actions_executed', v_action_count,
        'resolved_ids', v_resolved_ids
    );
EXCEPTION WHEN OTHERS THEN
    -- Audit log (error)
    BEGIN
        INSERT INTO growy_audit_log (
            organization_id, user_id, action_count, actions, result, error_message
        )
        VALUES (
            p_org_id, p_profile_id, v_action_count, p_actions, 'error', SQLERRM
        );
    EXCEPTION WHEN OTHERS THEN
        -- Ignore audit errors to not mask the original error
        NULL;
    END;
    
    RAISE EXCEPTION 'Error atómico ejecutando lote Growy: % - %', SQLERRM, SQLSTATE;
END;
$$;
