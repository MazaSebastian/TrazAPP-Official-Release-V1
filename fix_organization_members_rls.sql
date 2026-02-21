-- 1. Create a helper function that runs with elevated privileges (SECURITY DEFINER)
-- This avoids infinite recursion when checking RLS policies on the same table.
CREATE OR REPLACE FUNCTION public.get_my_org_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY SELECT organization_id FROM public.organization_members
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update the RLS policy using the helper function
DO $$ 
BEGIN
    -- Drop previous conflicting policies
    DROP POLICY IF EXISTS "Members can view own memberships" ON public.organization_members;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.organization_members;
    DROP POLICY IF EXISTS "Members can view all members in their orgs" ON public.organization_members;
    
    -- Los miembros de una organizacion pueden ver a todos los demas miembros de su orga
    CREATE POLICY "Members can view all members in their orgs" ON public.organization_members
    FOR SELECT 
    USING (organization_id IN (SELECT public.get_my_org_ids()));
    
    -- Solo Owners y Admins pueden actualizar roles de miembros
    DROP POLICY IF EXISTS "Owners and admins can update members" ON public.organization_members;
    CREATE POLICY "Owners and admins can update members" ON public.organization_members
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.organization_members my_membership
        WHERE my_membership.organization_id = organization_members.organization_id
        AND my_membership.user_id = auth.uid()
        AND my_membership.role IN ('owner', 'admin')
      )
    );

    -- Solo Owners y Admins pueden borrar miembros de la organizacion
    DROP POLICY IF EXISTS "Owners and admins can delete members" ON public.organization_members;
    CREATE POLICY "Owners and admins can delete members" ON public.organization_members
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.organization_members my_membership
        WHERE my_membership.organization_id = organization_members.organization_id
        AND my_membership.user_id = auth.uid()
        AND my_membership.role IN ('owner', 'admin')
      )
    );
END $$;
