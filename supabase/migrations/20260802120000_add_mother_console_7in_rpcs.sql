-- ============================================================
-- Migration: Add Mother Console 7" RPCs for Room Aggregation & Device Control
-- ============================================================

-- 1. RPC para obtener consolidadas las métricas de la sala y sus dispositivos asignados
CREATE OR REPLACE FUNCTION public.get_mother_room_console_data(p_room_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_name text := '';
  v_room_type text := 'flowering';
  v_bunker_name text := '';
  v_avg_temp numeric := 0;
  v_avg_hum numeric := 0;
  v_avg_vpd numeric := 0;
  v_avg_co2 numeric := 400;
  v_plant_count int := 0;
  v_plant_stage text := 'Floración';
  v_devices json := '[]'::json;
  v_tasks json := '[]'::json;
  v_incidents json := '[]'::json;
BEGIN
  -- Lookup room
  SELECT name, type INTO v_room_name, v_room_type
  FROM public.rooms
  WHERE id = p_room_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'is_valid', false,
      'message', 'Sala no encontrada'
    );
  END IF;

  -- Get active plant count & stage from batches
  SELECT COALESCE(SUM(quantity), 0), COALESCE(MAX(stage), 'vegetation')
  INTO v_plant_count, v_plant_stage
  FROM public.batches
  WHERE current_room_id = p_room_id AND discarded_at IS NULL;

  -- Format stage to Spanish
  IF v_room_type = 'flowering' OR v_plant_stage ILIKE '%flora%' THEN
    v_plant_stage := 'Floración';
  ELSIF v_plant_stage ILIKE '%veg%' THEN
    v_plant_stage := 'Vegetativo';
  ELSIF v_plant_stage ILIKE '%clon%' OR v_plant_stage ILIKE '%esquej%' THEN
    v_plant_stage := 'Esquejes';
  ELSE
    v_plant_stage := 'Floración';
  END IF;

  -- Get assigned devices metrics & states
  SELECT COALESCE(json_agg(json_build_object(
    'device_id', device_id,
    'name', COALESCE(name, device_id),
    'mesa_name', COALESCE(mesa_name, 'Mesa 1'),
    'is_online', COALESCE(is_online, false),
    'last_temp', COALESCE(last_temp, 0.0),
    'last_hum', COALESCE(last_hum, 0.0),
    'last_vpd', COALESCE(last_vpd, 0.0),
    'relays_state', COALESCE(relays_state, '[false,false,false,false]'::jsonb),
    'setpoints', COALESCE(setpoints, '{"target_temp":25.0,"target_hum":60.0}'::jsonb)
  )), '[]'::json)
  INTO v_devices
  FROM (
    SELECT 
      device_id,
      name,
      bunker_name AS mesa_name,
      (last_ping IS NOT NULL AND last_ping > NOW() - INTERVAL '2 minutes') AS is_online,
      (telemetry->>'temperature')::numeric AS last_temp,
      (telemetry->>'humidity')::numeric AS last_hum,
      (telemetry->>'vpd')::numeric AS last_vpd,
      actuators AS relays_state,
      settings AS setpoints
    FROM public.trazapp_devices
    WHERE room_id = p_room_id AND is_active = true
    ORDER BY created_at ASC
  ) d;

  -- Calculate room averages from online devices
  SELECT 
    COALESCE(ROUND(AVG((telemetry->>'temperature')::numeric), 1), 25.0),
    COALESCE(ROUND(AVG((telemetry->>'humidity')::numeric), 1), 60.0),
    COALESCE(ROUND(AVG((telemetry->>'vpd')::numeric), 2), 0.95),
    COALESCE(ROUND(AVG((telemetry->>'co2')::numeric), 0), 450)
  INTO v_avg_temp, v_avg_hum, v_avg_vpd, v_avg_co2
  FROM public.trazapp_devices
  WHERE room_id = p_room_id AND is_active = true AND last_ping > NOW() - INTERVAL '2 minutes';

  -- Get pending tasks for this room
  SELECT COALESCE(json_agg(json_build_object(
    'id', id,
    'title', title,
    'status', status,
    'description', COALESCE(description, '')
  )), '[]'::json)
  INTO v_tasks
  FROM (
    SELECT id, title, status, description
    FROM public.chakra_tasks
    WHERE room_id = p_room_id
      AND status IN ('pending', 'in_progress')
      AND (type IS NULL OR type != 'incidencia')
    ORDER BY created_at DESC
    LIMIT 10
  ) t;

  -- Get active incidents
  SELECT COALESCE(json_agg(json_build_object(
    'id', id,
    'title', title,
    'status', status,
    'description', COALESCE(description, ''),
    'severity', COALESCE(severity, 'warning')
  )), '[]'::json)
  INTO v_incidents
  FROM (
    SELECT id, title, status, description, severity
    FROM public.incidents
    WHERE room_id = p_room_id
      AND status = 'open'
    ORDER BY created_at DESC
    LIMIT 10
  ) i;

  RETURN json_build_object(
    'is_valid', true,
    'room_info', json_build_object(
      'room_id', p_room_id,
      'room_name', COALESCE(v_room_name, 'Sala Principal'),
      'avg_temp', v_avg_temp,
      'avg_hum', v_avg_hum,
      'avg_vpd', v_avg_vpd,
      'avg_co2', v_avg_co2,
      'plant_count', v_plant_count,
      'plant_stage', v_plant_stage
    ),
    'devices', v_devices,
    'tasks', v_tasks,
    'incidents', v_incidents
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_mother_room_console_data(uuid) TO anon, authenticated, service_role;

-- 2. RPC para alternar el estado de relé/actuador de un dispositivo objetivo
CREATE OR REPLACE FUNCTION public.set_device_actuator(
  p_target_device_id text,
  p_relay_index int,
  p_state boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.trazapp_devices
  SET 
    actuators = jsonb_set(
      COALESCE(actuators, '[false,false,false,false]'::jsonb),
      ARRAY[(p_relay_index - 1)::text],
      to_jsonb(p_state)
    ),
    updated_at = NOW()
  WHERE device_id = p_target_device_id;

  RETURN json_build_object('success', true, 'device_id', p_target_device_id, 'relay', p_relay_index, 'state', p_state);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_device_actuator(text, int, boolean) TO anon, authenticated, service_role;

-- 3. RPC para actualizar setpoints de un dispositivo objetivo
CREATE OR REPLACE FUNCTION public.update_device_setpoint(
  p_target_device_id text,
  p_setpoint_name text,
  p_value numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.trazapp_devices
  SET 
    settings = jsonb_set(
      COALESCE(settings, '{}'::jsonb),
      ARRAY[p_setpoint_name],
      to_jsonb(p_value)
    ),
    updated_at = NOW()
  WHERE device_id = p_target_device_id;

  RETURN json_build_object('success', true, 'device_id', p_target_device_id, 'setpoint', p_setpoint_name, 'value', p_value);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_device_setpoint(text, text, numeric) TO anon, authenticated, service_role;
