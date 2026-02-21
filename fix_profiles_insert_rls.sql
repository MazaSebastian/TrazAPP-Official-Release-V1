-- Fix for Profile Insert RLS Error during Registration
-- The previous profile policy setup was missing an INSERT policy.

DO $$ 
BEGIN

    -- 1. Explicitly drop it if it existed previously
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    
    -- 2. Create the policy allowing users to insert a profile ONLY for their own auth.uid()
    CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

END $$;
