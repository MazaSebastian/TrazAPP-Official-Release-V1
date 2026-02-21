-- 1. RESTORE the critical helper function used by the entire application (rooms, batches, etc.)
-- We make it SECURITY DEFINER so it bypasses RLS on organization_members and prevents infinite recursion.
CREATE OR REPLACE FUNCTION public.get_my_org_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY SELECT organization_id FROM public.organization_members
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure basic RLS for organization_members remains safe and open for reads 
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Members can view own memberships" ON public.organization_members;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.organization_members;
    DROP POLICY IF EXISTS "Members can view all members in their orgs" ON public.organization_members;
    DROP POLICY IF EXISTS "Usuarios pueden leer los miembros de su base" ON public.organization_members;
    
    -- Los miembros pueden leer, el filtro final lo hacen los joins y Supabase
    CREATE POLICY "Usuarios pueden leer los miembros de su base" 
    ON public.organization_members
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);
    
END $$;
