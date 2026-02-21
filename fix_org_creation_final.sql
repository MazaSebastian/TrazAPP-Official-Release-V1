-- 1. Make sure is_super_admin function is robust
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  _role text;
BEGIN
  -- Handle potential nulls just in case
  SELECT role INTO _role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(_role, '') = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop all existing potentially conflicting policies on organizations
DROP POLICY IF EXISTS "Enable all access for now" ON public.organizations;
DROP POLICY IF EXISTS "Only Super Admin can manage organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners can update their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can manage all organizations" ON public.organizations;

-- 3. Recreate fresh, correct policies

-- SELECT: Users can view organizations they are members of, OR if they are super admin
CREATE POLICY "Users can view own organizations"
ON public.organizations
FOR SELECT
USING (
  id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  OR 
  public.is_super_admin()
);

-- INSERT: Any authenticated user can create an organization
CREATE POLICY "Users can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE/DELETE: Super Admins can manage all
CREATE POLICY "Super admins can manage all organizations"
ON public.organizations
FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- UPDATE: Owners and admins can update their OWN organization
CREATE POLICY "Owners can update their organizations"
ON public.organizations
FOR UPDATE
USING (
  id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);
