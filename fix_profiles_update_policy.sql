-- This patch ensures that users can update their own profile records,
-- specifically needed so they can save their 'professional_signature_url'.

-- 1. Enable RLS on profiles if not already enabled (safety check)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing update policy for profiles to cleanly recreate it
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. Create the definitive policy allowing users to update their own row
CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Just to be absolutely sure, let's verify SELECT as well
DROP POLICY IF EXISTS "Users can read own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

CREATE POLICY "Users can read own profile."
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);
