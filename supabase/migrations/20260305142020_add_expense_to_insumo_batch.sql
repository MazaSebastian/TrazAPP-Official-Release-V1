-- /Users/sebamaza/Desktop/PROYECTOS DEV/APIDC GROW/TrazAPP V1 - First Release/TrazAPP V1/supabase/migrations/20260305142020_add_expense_to_insumo_batch.sql

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
    v_resolved_ids JSONB := '{}'::JSONB; -- Map de Temporary IDs -> Real UUIDs
    v_temp_id UUID;
    v_temp_ref TEXT;
    
    -- Variables para referencias
    v_spot_id UUID;
    v_spot_id_ref TEXT;
    v_room_id UUID;
    v_room_id_ref TEXT;
BEGIN
    FOR v_action IN SELECT * FROM jsonb_array_elements(p_actions)
    LOOP
        v_action_name := v_action->>'name';
        v_args := v_action->'args';
        
        -- Verificar si esta accion propone un ID temporal de referencia
        v_temp_ref := v_args->>'id';

        -------------------------------------------------------------
        -- Módulo: create_crop
        -------------------------------------------------------------
        IF v_action_name = 'create_crop' THEN
            INSERT INTO chakra_crops (
                organization_id, 
                name, 
                location, 
                start_date, 
                estimated_harvest_date, 
                status, 
                color
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
        -- Módulo: create_room
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
                organization_id, 
                name, 
                type, 
                capacity, 
                spot_id
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
        -- Módulo: create_task
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
                organization_id, 
                title, 
                description, 
                type,
                due_date, 
                status, 
                assigned_to, 
                crop_id, 
                room_id, 
                recurrence
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
        -- Módulo: create_room_sticky (Notas de Pizarra)
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
                organization_id, 
                content, 
                color,
                room_id,
                user_id,
                created_by
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
        -- Módulo: create_map (Mesas / Planos de Trabajo)
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
                organization_id, 
                room_id,
                name,
                grid_rows,
                grid_columns
            )
            VALUES (
                p_org_id,
                v_room_id,
                v_args->>'name',
                (v_args->>'grid_rows')::INT,
                (v_args->>'grid_columns')::INT
            )
            RETURNING id INTO v_temp_id;

        -------------------------------------------------------------
        -- Módulo: create_expense (Gastos e Ingresos Financieros)
        -------------------------------------------------------------
        ELSIF v_action_name = 'create_expense' THEN
            INSERT INTO chakra_expenses (
                organization_id, 
                responsible_user_id,
                concept,
                amount,
                type,
                payment_method,
                owner,
                date
            )
            VALUES (
                p_org_id,
                p_profile_id,
                v_args->>'title',
                (v_args->>'amount')::NUMERIC,
                v_args->>'type',
                COALESCE(v_args->>'payment_method', 'Efectivo'),
                'Growy AI',
                CURRENT_DATE
            )
            RETURNING id INTO v_temp_id;

        -------------------------------------------------------------
        -- Módulo: create_insumo (Inventario de Suministros)
        -------------------------------------------------------------
        ELSIF v_action_name = 'create_insumo' THEN
            INSERT INTO chakra_stock_items (
                organization_id, 
                nombre,
                categoria,
                unidad_medida,
                precio_actual,
                stock_actual,
                stock_minimo,
                precio_anterior,
                fecha_ultimo_precio,
                fecha_ultima_compra,
                activo
            )
            VALUES (
                p_org_id,
                v_args->>'nombre',
                v_args->>'categoria',
                v_args->>'unidad_medida',
                (v_args->>'precio_actual')::NUMERIC,
                (v_args->>'stock_actual')::NUMERIC,
                (v_args->>'stock_minimo')::NUMERIC,
                (v_args->>'precio_actual')::NUMERIC,
                CURRENT_DATE,
                CURRENT_DATE,
                true
            )
            RETURNING id INTO v_temp_id;

            -- Auto-generar un Gasto (EGRESO) por la compra del insumo
            -- (Misma l\u00f3gica que Insumos.tsx frontend)
            INSERT INTO chakra_expenses (
                organization_id, 
                responsible_user_id,
                concept,
                amount,
                type,
                payment_method,
                owner,
                date
            )
            VALUES (
                p_org_id,
                p_profile_id,
                'Compra de insumo: ' || (v_args->>'nombre'),
                ((v_args->>'precio_actual')::NUMERIC * (v_args->>'stock_actual')::NUMERIC),
                'EGRESO',
                'Efectivo', -- Pago por defecto ya que Growy asume o puede obviar el método de pago para insumos
                'Growy AI',
                CURRENT_DATE
            );

        ELSE
            -- Acción desconocida, provocar fallo transaccional
            RAISE EXCEPTION 'Acción Growy no soportada en el lote: %', v_action_name;
        END IF;

        -- Registrar mapeo temporal
        IF v_temp_ref IS NOT NULL THEN
            v_resolved_ids := jsonb_set(v_resolved_ids, array[v_temp_ref], to_jsonb(v_temp_id::TEXT));
        END IF;

        -- Limpiar IDs iterativos para proxima vuelta
        v_spot_id := NULL;
        v_room_id := NULL;
        v_temp_ref := NULL;

    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Lote Growy ejecutado exitosamente',
        'resolved_ids', v_resolved_ids
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error atómico ejecutando lote Growy: % - %', SQLERRM, SQLSTATE;
END;
$$;
