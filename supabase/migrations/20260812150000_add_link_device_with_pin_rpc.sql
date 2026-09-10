-- ============================================================
-- Migration: Add link_device_with_pin RPC Function
-- Purpose: Allows users to link hardware devices using Device ID + PIN
--          with SECURITY DEFINER to bypass SELECT RLS restrictions.
-- ============================================================

CREATE OR REPLACE FUNCTION public.link_device_with_pin(
  p_device_id text,
  p_pin text,
  p_org_id uuid,
  p_alias text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_device record;
  v_first_room_id uuid;
BEGIN
  -- Search for device regardless of RLS
  SELECT * INTO v_device
  FROM public.trazapp_devices
  WHERE device_id = p_device_id AND is_active = true;

  IF NOT FOUND THEN
    -- If device row doesn't exist yet in DB, auto-create it with this PIN & link to org
    SELECT id INTO v_first_room_id FROM public.rooms WHERE organization_id = p_org_id LIMIT 1;

    INSERT INTO public.trazapp_devices (
      device_id, pin, organization_id, room_id, alias, is_provisioned, is_active
    ) VALUES (
      p_device_id, p_pin, p_org_id, v_first_room_id, p_alias, true, true
    );

    RETURN json_build_object('success', true, 'message', 'Dispositivo vinculado correctamente.');
  END IF;

  -- If device row exists, verify PIN if set
  IF v_device.pin IS NOT NULL AND v_device.pin <> '' AND v_device.pin <> p_pin THEN
    RETURN json_build_object('success', false, 'error', 'PIN incorrecto. Verificá los datos en la pantalla del equipo.');
  END IF;

  -- Check if already provisioned to another org
  IF v_device.is_provisioned AND v_device.organization_id IS NOT NULL AND v_device.organization_id <> p_org_id THEN
    RETURN json_build_object('success', false, 'error', 'Este dispositivo ya está vinculado a otra organización.');
  END IF;

  -- Get first room of this org if room_id is empty
  SELECT id INTO v_first_room_id FROM public.rooms WHERE organization_id = p_org_id LIMIT 1;

  -- Update device row to link to user's org
  UPDATE public.trazapp_devices
  SET organization_id = p_org_id,
      user_id = auth.uid(),
      is_provisioned = true,
      pin = p_pin,
      room_id = COALESCE(room_id, v_first_room_id),
      alias = COALESCE(p_alias, alias)
  WHERE device_id = p_device_id;

  RETURN json_build_object('success', true, 'message', 'Dispositivo vinculado correctamente.');
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_device_with_pin(text, text, uuid, text) TO authenticated, anon, service_role;
