-- ============================================================
-- Migration: Update Hardware RPC for Real Room Stage and Plant Tags
-- ============================================================

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
  v_room_type text := 'flowering';
  v_plant_count int := 0;
  v_raw_stage text := 'vegetation';
  v_plant_stage text := 'Floración';
  v_tasks json := '[]'::json;
  v_task_count int := 0;
  v_plant_tags json := '[]'::json;
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
      'plant_stage', 'Floración',
      'task_count', 0,
      'tasks', '[]'::json,
      'plant_tags', '[]'::json
    );
  END IF;

  -- Get room name & type
  SELECT name, type INTO v_room_name, v_room_type FROM public.rooms WHERE id = v_room_id;

  -- Get active plant count & stage from batches
  SELECT COALESCE(SUM(quantity), 0), COALESCE(MAX(stage), 'vegetation')
  INTO v_plant_count, v_raw_stage
  FROM public.batches
  WHERE current_room_id = v_room_id AND discarded_at IS NULL;

  -- Translate stage to Spanish
  IF v_room_type = 'flowering' OR v_raw_stage ILIKE '%flora%' OR v_raw_stage ILIKE '%flower%' THEN
    v_plant_stage := 'Floración';
  ELSIF v_raw_stage ILIKE '%veg%' THEN
    v_plant_stage := 'Vegetativo';
  ELSIF v_raw_stage ILIKE '%clon%' OR v_raw_stage ILIKE '%esquej%' THEN
    v_plant_stage := 'Esquejes';
  ELSIF v_raw_stage ILIKE '%secad%' OR v_raw_stage ILIKE '%dry%' THEN
    v_plant_stage := 'Secado';
  ELSE
    v_plant_stage := 'Floración';
  END IF;

  -- Get active plant tracking codes / names (capped at 16)
  SELECT COALESCE(json_agg(name), '[]'::json)
  INTO v_plant_tags
  FROM (
    SELECT COALESCE(tracking_code, name, CONCAT('Planta #', row_number() OVER ())) AS name
    FROM public.batches
    WHERE current_room_id = v_room_id AND discarded_at IS NULL
    ORDER BY created_at ASC
    LIMIT 16
  ) p;

  -- Get pending/in_progress tasks for this room scheduled for today
  SELECT COUNT(*), COALESCE(json_agg(json_build_object('id', id, 'title', title, 'status', status, 'description', COALESCE(description, ''))), '[]'::json)
  INTO v_task_count, v_tasks
  FROM (
    SELECT id, title, status, description
    FROM public.chakra_tasks
    WHERE room_id = v_room_id
      AND status IN ('pending', 'in_progress')
      AND (due_date IS NULL OR due_date::date = CURRENT_DATE)
      AND (type IS NULL OR type != 'incidencia')
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
    'tasks', v_tasks,
    'plant_tags', v_plant_tags
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_device_bunker_meta(text) TO anon, authenticated, service_role;
