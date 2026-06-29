-- Migration: Add unlink_device RPC function
-- Description: Create a SECURITY DEFINER function to allow users to unlink their devices
--              securely, bypassing RLS issues.

CREATE OR REPLACE FUNCTION public.unlink_device(p_device_id text)
RETURNS void AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Get the organization_id of the device
  SELECT organization_id INTO v_org_id
  FROM public.trazapp_devices
  WHERE device_id = p_device_id;

  -- Check if the current user is a member of that organization
  IF EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = auth.uid() AND organization_id = v_org_id
  ) OR EXISTS (
    -- Or if the user is a super admin
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  ) THEN
    -- Perform the update bypassing RLS (since function is SECURITY DEFINER)
    UPDATE public.trazapp_devices
    SET 
      organization_id = null,
      user_id = null,
      is_provisioned = false,
      alias = null,
      room_id = null,
      updated_at = now()
    WHERE device_id = p_device_id;
  ELSE
    RAISE EXCEPTION 'No tienes permisos para desvincular este dispositivo.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
