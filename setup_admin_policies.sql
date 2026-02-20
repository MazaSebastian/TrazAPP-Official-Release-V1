-- 1. Helper Function to check if user is Super Admin
-- Relies on 'role' column in public.profiles.
-- Ensure you have manually updated your own profile role to 'super_admin' in Supabase Table Editor.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  _role text;
BEGIN
  SELECT role INTO _role FROM public.profiles WHERE id = auth.uid();
  RETURN _role = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Secure Organizations Table
-- First, drop the insecure temporary policy if it exists
DROP POLICY IF EXISTS "Enable all access for now" ON public.organizations;

-- Read: Users can see organizations they belong to OR if they are super admin
CREATE POLICY "Users can view own organizations"
ON public.organizations
FOR SELECT
USING (
  id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  OR 
  is_super_admin()
);

-- Write (Insert/Update/Delete): ONLY Super Admin
CREATE POLICY "Only Super Admin can manage organizations"
ON public.organizations
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());


-- 3. Helpers for Admin Dashboard

-- Allow Admin to view all profiles (to select owners)
-- Start by dropping generic profile policies if they are too open/closed?
-- Usually profiles are public read, but let's ensure Admin has explicit access.
-- (Assuming profiles has "Public profiles are viewable by everyone" from SCHEMA_SETUP.sql)

-- 4. Atomic Organization Creation RPC
-- This allows the Frontend to create Org + Member in one request
CREATE OR REPLACE FUNCTION public.admin_create_organization(
    org_name TEXT,
    org_plan TEXT,
    owner_email TEXT
)
RETURNS UUID AS $$
DECLARE
    new_org_id UUID;
    owner_user_id UUID;
BEGIN
    -- 1. Check Permissions
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only Super Admins can perform this action.';
    END IF;

    -- 2. Find User by Email
    -- This relies on profiles having email? Or auth.users?
    -- ACCESSING auth.users from PLPGSQL is restricted. 
    -- We can try looking up public.profiles if we store email there (usersService.ts interface suggests we might not store it consistently or it's in auth).
    -- If profiles doesn't have email, we might need to pass ID.
    -- Let's check profiles table definition in SCHEMA_SETUP. It has 'username', 'full_name', no email column explicitly guaranteed?
    -- Wait, SCHEMA_SETUP line 10: profiles table. No email column. But usersService has it optional.
    
    -- ADJUSTMENT: For safety, let's try to look up by ID passed from frontend (which searched separately) OR 
    -- if we really want email, we need to ensure email is sync'd to profiles.
    -- Let's assume for now we pass OWNER_ID.
    
    -- RE-PLAN: Function accepts owner_id
    RAISE EXCEPTION 'Use admin_create_organization_by_id instead.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.admin_create_organization_by_id(
    org_name TEXT,
    org_plan TEXT,
    owner_id UUID
)
RETURNS UUID AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- 1. Check Permissions
    IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Access Denied: Only Super Admins can perform this action.';
    END IF;

    -- 2. Create Org
    INSERT INTO public.organizations (name, plan)
    VALUES (org_name, org_plan)
    RETURNING id INTO new_org_id;

    -- 3. Assign Owner
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, owner_id, 'owner');

    RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
