-- RLS Bypass Function for Invite Validation
-- This function runs as SECURITY DEFINER (elevated permissions) allowing
-- unauthenticated users to read the invitation details AND the linked organization's plan,
-- without exposing the entire 'organizations' table to the public.

CREATE OR REPLACE FUNCTION public.get_invite_details(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Build a JSONB object containing exactly what the frontend needs
    SELECT jsonb_build_object(
        'id', i.id,
        'organization_id', i.organization_id,
        'email', i.email,
        'role', i.role,
        'token', i.token,
        'status', i.status,
        'expires_at', i.expires_at,
        'created_at', i.created_at,
        'organization', jsonb_build_object(
            'id', o.id,
            'name', o.name,
            'plan', o.plan
        )
    ) INTO result
    FROM public.organization_invites i
    JOIN public.organizations o ON i.organization_id = o.id
    WHERE i.token = p_token
    -- Solo devolver invitaciones pendientes
    AND i.status = 'pending';

    RETURN result;
END;
$$;
