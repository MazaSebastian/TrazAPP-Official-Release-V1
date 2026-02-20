-- 1. Helper Function to check if user is Super Admin
-- This function reads the 'role' column from public.profiles
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  _role text;
BEGIN
  -- Select role from profiles table for the current authenticated user
  SELECT role INTO _role FROM public.profiles WHERE id = auth.uid();
  -- Return true if role is 'super_admin', false otherwise
  RETURN _role = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure Profiles are Readable by Owner
-- This prevents "Transient" role issues where fetchProfile returns null due to RLS
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING ( auth.uid() = id );

-- 3. Ensure Super Admin can view all profiles (for dashboard)
DROP POLICY IF EXISTS "Super Admin can view all profiles" ON public.profiles;

CREATE POLICY "Super Admin can view all profiles"
ON public.profiles
FOR SELECT
USING ( is_super_admin() );

-- 4. Allow Users to Update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING ( auth.uid() = id );
