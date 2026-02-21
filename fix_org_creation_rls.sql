-- Fix for Organization Creation RLS Error
-- The previous policy only allowed super_admins to INSERT organizations.
-- Users creating organizations via invitations need to be able to create their own tenant.

DO $$ 
BEGIN

    -- 1. Drop the restrictive Super Admin policy if it exists
    DROP POLICY IF EXISTS "Only Super Admin can manage organizations" ON public.organizations;
    
    -- 2. Allow any authenticated user to CREATE an organization
    DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
    CREATE POLICY "Users can create organizations"
    ON public.organizations
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

    -- 3. Allow Owners and Admins to UPDATE their own organizations (like changing names)
    DROP POLICY IF EXISTS "Owners can update their organizations" ON public.organizations;
    CREATE POLICY "Owners can update their organizations"
    ON public.organizations
    FOR UPDATE
    USING (
      id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    );

    -- 4. Ensure users can insert themselves as owners of the organization they just created
    DROP POLICY IF EXISTS "Users can insert members" ON public.organization_members;
    CREATE POLICY "Users can insert members"
    ON public.organization_members
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

END $$;
