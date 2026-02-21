-- Fix for Organization Members Insert RLS Error during Registration
-- The previous policy setup might have dropped or restricted the ability for new invited users to insert their membership record.

DO $$ 
BEGIN

    -- 1. Ensure authenticated users can insert into organization_members
    -- This is required during the Registration flow (`Register.tsx`) when joining via an invite link.
    -- The application logic validates the token before attempting this insert.
    DROP POLICY IF EXISTS "Users can insert members" ON public.organization_members;
    
    CREATE POLICY "Users can insert members"
    ON public.organization_members
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

    -- 2. Make sure this policy isn't conflicting with anything else.
    -- We already established SELECT, UPDATE, DELETE policies in previous fixes.
    -- The INSERT policy above is sufficient for new registrations.

END $$;
