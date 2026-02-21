-- 1. Ensure our helper function exists (created in our previous fix)
CREATE OR REPLACE FUNCTION public.get_my_org_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY SELECT organization_id FROM public.organization_members
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Clean up old problematic policies on the main organizations table
DROP POLICY IF EXISTS "Users can view own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Enable all access for now" ON public.organizations;

-- 3. Recreate the organizations Read policy using the safe helper function
CREATE POLICY "Users can view own organizations"
ON public.organizations
FOR SELECT
USING (
  id IN (SELECT public.get_my_org_ids())
  OR 
  public.is_super_admin()
);
