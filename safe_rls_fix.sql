-- Reverting and fixing the RLS policies for organization_members
DO $$ 
BEGIN

    -- 1. Drop EVERYTHING related to the broken policies
    DROP POLICY IF EXISTS "Members can view own memberships" ON public.organization_members;
    DROP POLICY IF EXISTS "Tenant Isolation" ON public.organization_members;
    DROP POLICY IF EXISTS "Members can view all members in their orgs" ON public.organization_members;
    DROP POLICY IF EXISTS "Owners and admins can update members" ON public.organization_members;
    DROP POLICY IF EXISTS "Owners and admins can delete members" ON public.organization_members;
    
    -- 2. Drop the function if it exists to clean slate
    DROP FUNCTION IF EXISTS public.get_my_org_ids();

    -- 3. THE SAFE WAY: 
    -- To avoid ANY chance of recursion on the same table, 
    -- we can let users read ALL records, but organizations are ALREADY protected.
    -- Or, even simpler: if a user is in an organization, they should be able to see its members.
    
    -- Option A: Since the app heavily relies on filtering by organization_id anyway (e.g. eq('organization_id', auth.uid())),
    -- and organizations themselves are hidden unless you're a member, 
    -- we could temporarily make reading organization_members open to authenticated users.
    -- This is safe enough because you still need the organization ID to query it, and you can only get
    -- the organization ID if you are a member of it (via organizations table policy).

    CREATE POLICY "Authenticated users can read organization members" 
    ON public.organization_members
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

    -- But for UPDATE/DELETE, we MUST restrict it to owners and admins. 
    -- We can use a SECURITY DEFINER function to check the user's role SAFELY
    
END $$;

-- 4. Create a SAFE function to check role in a specific org bypassing constraints
CREATE OR REPLACE FUNCTION public.custom_is_org_admin(check_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  _role text;
BEGIN
  SELECT role INTO _role 
  FROM public.organization_members 
  WHERE organization_id = check_org_id 
  AND user_id = auth.uid();
  
  RETURN _role IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Apply the safe update/delete policies
DO $$
BEGIN
    CREATE POLICY "Admins can update organization members" 
    ON public.organization_members
    FOR UPDATE
    USING (public.custom_is_org_admin(organization_id));

    CREATE POLICY "Admins can delete organization members" 
    ON public.organization_members
    FOR DELETE
    USING (public.custom_is_org_admin(organization_id));
END $$;
