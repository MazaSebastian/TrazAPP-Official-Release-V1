-- ==============================================================================
-- FIX (V8): accept_invitation RPC (Removing non-existent 'accepted_at' column)
-- ==============================================================================
-- El error previo ocurría porque estábamos intentando estampar la fecha de
-- aceptación en una columna llamada `accepted_at`, la cual no existe en la
-- definición de la tabla `organization_invites` del proyecto.
-- 
-- SOLUCIÓN: Simplemente actualizamos el `status` a 'accepted' y lo damos por hecho.
-- ==============================================================================

-- 1. Limpiezas finales
DROP FUNCTION IF EXISTS public.accept_invitation(uuid, uuid, text, text, text, text);
DROP FUNCTION IF EXISTS public.accept_invitation(text, uuid, text, text, text, text);

-- 2. Creación de la Función Limpia (V8)
CREATE OR REPLACE FUNCTION accept_invitation(
  p_token TEXT,
  p_user_id UUID,
  p_full_name TEXT,
  p_phone TEXT,
  p_referral_source TEXT,
  p_ong_name TEXT
) RETURNS void AS $$
DECLARE
  v_invite RECORD;
  v_user_profile RECORD;
BEGIN

  -- 1. Validar Token de Invitación
  SELECT * INTO v_invite
  FROM organization_invites
  WHERE token = p_token AND status = 'pending' AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitación inválida, expirada o ya utilizada.';
  END IF;

  -- 2. Asegurarse de que el usuario YA FUE CREADO por el Trigger de Auth 
  SELECT * INTO v_user_profile FROM public.profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El perfil aún no ha sido sincronizado por el servidor. Reintentando...';
  END IF;

  -- 3. Vincular al usuario con su nueva Organización
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (v_invite.organization_id, p_user_id, v_invite.role)
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  -- 4. Marcar invitación como consumida
  -- (Eliminado accepted_at porque la columna no existe en TrazAPP)
  UPDATE organization_invites
  SET 
    status = 'accepted'
  WHERE token = p_token;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
