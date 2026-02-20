-- 1. Ensure Profiles are Readable by Owner
-- This prevents "Transient" role issues where fetchProfile returns null due to RLS
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING ( auth.uid() = id );

-- 2. Ensure Super Admin can view all profiles (for dashboard)
DROP POLICY IF EXISTS "Super Admin can view all profiles" ON public.profiles;

CREATE POLICY "Super Admin can view all profiles"
ON public.profiles
FOR SELECT
USING ( is_super_admin() );

-- 3. Allow Users to Update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING ( auth.uid() = id );
