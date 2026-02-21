-- Fix for Postgres Function Overloading Error
-- When we changed p_token from UUID to TEXT, Postgres kept the old function and created a new one.
-- Now RPC doesn't know which one to pick. Let's explicitly drop BOTH versions, then recreate the right one.

DO $$ 
BEGIN
    -- Drop the UUID version if it exists
    DROP FUNCTION IF EXISTS public.accept_invitation(UUID, UUID, TEXT, TEXT, TEXT, TEXT);
    
    -- Drop the TEXT version if it exists
    DROP FUNCTION IF EXISTS public.accept_invitation(TEXT, UUID, TEXT, TEXT, TEXT, TEXT);

    -- Also try dropping without the default parameter just in case
    DROP FUNCTION IF EXISTS public.accept_invitation(UUID, UUID, TEXT, TEXT, TEXT);
    DROP FUNCTION IF EXISTS public.accept_invitation(TEXT, UUID, TEXT, TEXT, TEXT);
EXCEPTION
    WHEN OTHERS THEN
        -- Safely ignore errors here
END $$;

-- 1. Create a SECURITY DEFINER function to accept an invitation and setup the user
-- This runs with elevated privileges to bypass RLS limitations for unauthenticated (newly signed-up) users.
CREATE OR REPLACE FUNCTION public.accept_invitation(
    p_token TEXT, -- MUST BE TEXT to match organization_invites.token type
    p_user_id UUID,
    p_full_name TEXT,
    p_phone TEXT,
    p_referral_source TEXT,
    p_ong_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_invite public.organization_invites%ROWTYPE;
BEGIN
    -- 1. Validate the token and get invite details
    SELECT * INTO v_invite
    FROM public.organization_invites
    WHERE token = p_token AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invitation token';
    END IF;

    IF v_invite.expires_at < NOW() THEN
        RAISE EXCEPTION 'Invitation token has expired';
    END IF;

    -- 2. Handle Profile Upsert Safely
    -- A foreign key violation usually means the user record hasn't fully committed in auth.users
    -- OR a Supabase Trigger (`on_auth_user_created`) might already be creating the profile.
    
    -- Let's try to update it if it exists (created by trigger)
    UPDATE public.profiles 
    SET full_name = p_full_name, updated_at = NOW()
    WHERE id = p_user_id;

    -- If the update affected 0 rows, the trigger didn't create it, so WE insert it.
    -- However, if auth.users doesn't exist yet (async transaction gap), an INSERT will fail the FK constraint.
    IF NOT FOUND THEN
        BEGIN
            INSERT INTO public.profiles (id, full_name, updated_at)
            VALUES (p_user_id, p_full_name, NOW());
        EXCEPTION WHEN foreign_key_violation THEN
            -- If auth.users is genuinely missing in this transaction context, we just skip the profile insert
            -- The Supabase Trigger will catch it up later, or the user can update their profile in settings.
            -- We don't want to crash the whole organizational linking process.
            RAISE NOTICE 'Skipped profile insert due to auth.users sync delay';
        END;
    END IF;

    -- 3. Link user to organization
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (v_invite.organization_id, p_user_id, v_invite.role)
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- 4. Update the organization record if it's the first owner setting it up
    -- We'll just update it generally as per the original frontend logic
    IF p_ong_name IS NOT NULL THEN
        UPDATE public.organizations
        SET owner_name = p_full_name,
            phone = p_phone,
            referral_source = p_referral_source,
            status = 'active',
            name = p_ong_name,
            slug = lower(regexp_replace(p_ong_name, '\s+', '-', 'g'))
        WHERE id = v_invite.organization_id;
    ELSE
        UPDATE public.organizations
        SET owner_name = p_full_name,
            phone = p_phone,
            referral_source = p_referral_source,
            status = 'active'
        WHERE id = v_invite.organization_id;
    END IF;

    -- 5. Mark invite as accepted
    UPDATE public.organization_invites
    SET status = 'accepted'
    WHERE token = p_token;

    RETURN TRUE;

EXCEPTION
    WHEN OTHERS THEN
        RAISE; -- Re-raise the exception to be caught by Supabase client
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
