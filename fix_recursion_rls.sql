-- 1. DROP the recursive policy
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON public.organization_members;

-- 2. CREATE a helper function that runs with an elevated privilege (SECURITY DEFINER)
-- This allows it to read organization_members WITHOUT triggering the RLS policies again,
-- completely preventing the "infinite recursion" error.
CREATE OR REPLACE FUNCTION public.get_my_org_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY SELECT organization_id FROM public.organization_members
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RECREATE the policy using the safe helper function
CREATE POLICY "Users can view members of their organizations"
ON public.organization_members
FOR SELECT
USING (
    -- You can see your own row
    user_id = auth.uid() 
    OR 
    -- Or you can see anyone who shares an organization with you, fetched safely without looping!
    organization_id IN (SELECT public.get_my_org_ids())
);
