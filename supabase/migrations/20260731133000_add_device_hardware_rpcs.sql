-- ============================================================
-- Migration: Add Hardware RPC Functions for TrazAPP IoT Devices
-- Purpose: Allows ESP32 devices to fetch room metadata, plants, tasks,
--          and post incidents using SECURITY DEFINER (bypassing RLS safely).
-- ============================================================

-- 1. Function: get_device_bunker_meta
CREATE OR REPLACE FUNCTION public.get_device_bunker_meta(p_device_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id uuid;
  v_org_id uuid;
  v_bunker_name text;
  v_is_provisioned boolean;
  v_room_name text := '';
  v_plant_count int := 0;
  v_plant_stage text := 'Vegetativo';
  v_tasks json := '[]'::json;
  v_task_count int := 0;
BEGIN
  -- Lookup device row
  SELECT room_id, organization_id, bunker_name, is_provisioned
  INTO v_room_id, v_org_id, v_bunker_name, v_is_provisioned
  FROM public.trazapp_devices
  WHERE device_id = p_device_id AND is_active = true;

  IF NOT FOUND OR v_is_provisioned IS NOT TRUE OR v_room_id IS NULL THEN
    RETURN json_build_object(
      'is_provisioned', false,
      'bunker_name', 'SIN SALA',
      'room_name', 'SIN ASIGNAR',
      'plant_count', 0,
      'plant_stage', 'Vegetativo',
      'task_count', 0,
      'tasks', '[]'::json
    );
  END IF;

  -- Get room name
  SELECT name INTO v_room_name FROM public.rooms WHERE id = v_room_id;

  -- Get active plant count & stage from batches
  SELECT COALESCE(SUM(quantity), 0), COALESCE(MAX(stage), 'Vegetativo')
  INTO v_plant_count, v_plant_stage
  FROM public.batches
  WHERE current_room_id = v_room_id AND discarded_at IS NULL;

  -- Get pending/in_progress tasks for this room
  SELECT COUNT(*), COALESCE(json_agg(json_build_object('id', id, 'title', title, 'status', status)), '[]'::json)
  INTO v_task_count, v_tasks
  FROM (
    SELECT id, title, status
    FROM public.chakra_tasks
    WHERE room_id = v_room_id AND status IN ('pending', 'in_progress')
    ORDER BY created_at DESC
    LIMIT 5
  ) t;

  RETURN json_build_object(
    'is_provisioned', true,
    'bunker_name', COALESCE(v_bunker_name, v_room_name, 'Bunker'),
    'room_name', COALESCE(v_room_name, 'Bunker'),
    'plant_count', v_plant_count,
    'plant_stage', v_plant_stage,
    'task_count', v_task_count,
    'tasks', v_tasks
  );
END;
$$;


-- 2. Function: create_device_incident
CREATE OR REPLACE FUNCTION public.create_device_incident(
  p_device_id text,
  p_target text DEFAULT 'Bunker General',
  p_severity text DEFAULT 'MODERADA',
  p_title text DEFAULT 'Incidencia desde Dispositivo IoT'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id uuid;
  v_org_id uuid;
  v_new_task_id uuid;
BEGIN
  -- Lookup device row
  SELECT room_id, organization_id
  INTO v_room_id, v_org_id
  FROM public.trazapp_devices
  WHERE device_id = p_device_id AND is_active = true;

  IF v_org_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Dispositivo no provisto u organización invalida.');
  END IF;

  -- Create new task in chakra_tasks
  INSERT INTO public.chakra_tasks (
    organization_id,
    room_id,
    title,
    description,
    type,
    status
  ) VALUES (
    v_org_id,
    v_room_id,
    p_title,
    CONCAT('[INCIDENCIA HARDWARE] Severidad: ', p_severity, ' | Destino: ', p_target),
    'incidencia',
    'pending'
  ) RETURNING id INTO v_new_task_id;

  RETURN json_build_object(
    'success', true,
    'task_id', v_new_task_id,
    'message', 'Incidencia registrada como tarea pendiente.'
  );
END;
$$;

-- Grant execution to anon & authenticated roles
GRANT EXECUTE ON FUNCTION public.get_device_bunker_meta(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_device_incident(text, text, text, text) TO anon, authenticated, service_role;
