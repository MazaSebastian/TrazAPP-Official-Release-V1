-- ==========================================
-- Growy Batch Execution RPC
-- ==========================================
-- This function receives a JSON array of actions from Growy AI
-- and executes them sequentially in a single atomic transaction.
-- If any action fails, the entire batch is rolled back automatically.

CREATE OR REPLACE FUNCTION execute_growy_batch(
    p_org_id UUID,
    p_profile_id UUID,
    p_actions JSONB
) RETURNS JSONB AS $$
DECLARE
    v_action JSONB;
    v_action_name TEXT;
    v_args JSONB;
    v_results JSONB := '[]'::JSONB;
    v_temp_id UUID;
    v_resolved_ids JSONB := '{}'::JSONB; -- Para guardar IDs creados en este lote
    v_spot_id UUID;
    v_room_id UUID;
BEGIN
    -- Iterar sobre el array de acciones provisto por la IA
    FOR v_action IN SELECT * FROM jsonb_array_elements(p_actions)
    LOOP
        v_action_name := v_action->>'name';
        v_args := v_action->'args';
        
        -- ==========================================
        -- Acción: create_crop
        -- ==========================================
        IF v_action_name = 'create_crop' THEN
            INSERT INTO chakra_crops (
                organization_id, 
                name, 
                location, 
                start_date, 
                estimated_harvest_date, 
                status, 
                color, 
                created_by
            )
            VALUES (
                p_org_id,
                v_args->>'name',
                v_args->>'location',
                COALESCE((v_args->>'startDate')::DATE, CURRENT_DATE),
                (v_args->>'estimatedHarvestDate')::DATE,
                'active',
                COALESCE(v_args->>'color', 'green'),
                p_profile_id
            ) RETURNING id INTO v_temp_id;
            
            -- Guardar en diccionario de IDs resueltos (por si la IA mandó un ID falso "new_crop_1")
            IF v_args->>'id' IS NOT NULL THEN
                v_resolved_ids := jsonb_set(v_resolved_ids, ARRAY[v_args->>'id'], to_jsonb(v_temp_id::text));
            END IF;

            v_results := v_results || jsonb_build_object('action', v_action_name, 'status', 'success', 'id', v_temp_id);
            
        -- ==========================================
        -- Acción: create_room
        -- ==========================================
        ELSIF v_action_name = 'create_room' THEN
            -- Resolver dependencias de ID ("spotId" puede ser un UUID o una referencia a un crop recién creado)
            v_spot_id := (v_args->>'spotId')::UUID;
            
            INSERT INTO rooms (
                name, 
                type, 
                capacity, 
                spot_id, 
                organization_id
            )
            VALUES (
                v_args->>'name',
                v_args->>'type',
                COALESCE((v_args->>'capacity')::INT, 100),
                v_spot_id,
                p_org_id
            ) RETURNING id INTO v_temp_id;
            
            IF v_args->>'id' IS NOT NULL THEN
                v_resolved_ids := jsonb_set(v_resolved_ids, ARRAY[v_args->>'id'], to_jsonb(v_temp_id::text));
            END IF;

            v_results := v_results || jsonb_build_object('action', v_action_name, 'status', 'success', 'id', v_temp_id);
            
        -- ==========================================
        -- Acción: create_task
        -- ==========================================
        ELSIF v_action_name = 'create_task' THEN
            -- Prevenir errores si mandan null
            v_spot_id := NULLIF(v_args->>'spot_id', '')::UUID;
            v_room_id := NULLIF(v_args->>'room_id', '')::UUID;

            INSERT INTO chakra_tasks (
                organization_id, 
                title, 
                description, 
                due_date, 
                status, 
                created_by, 
                assigned_to, 
                spot_id, 
                room_id, 
                severity, 
                recurrence,
                type
            )
            VALUES (
                p_org_id,
                v_args->>'title',
                v_args->>'description',
                (v_args->>'dueDate')::TIMESTAMPTZ,
                'pending',
                p_profile_id,
                NULLIF(v_args->>'assigned_to', '')::UUID,
                v_spot_id,
                v_room_id,
                COALESCE(v_args->>'severity', 'media'),
                v_args->'recurrence',
                v_args->>'type'
            ) RETURNING id INTO v_temp_id;
            
            v_results := v_results || jsonb_build_object('action', v_action_name, 'status', 'success', 'id', v_temp_id);
            
        -- ==========================================
        -- Acción no soportada
        -- ==========================================
        ELSE
            RAISE EXCEPTION 'Acción de Growy no soportada en lotes: %', v_action_name;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'results', v_results);
EXCEPTION WHEN OTHERS THEN
    -- Ante cualquier error de Postgres (ej. Foreign Key, Not Null), rebotamos la excepción.
    -- PostgreSQL hará ROLLBACK automático de todo lo que pasó antes del error.
    RAISE EXCEPTION 'Error atómico ejecutando lote Growy: % - %', SQLERRM, SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
