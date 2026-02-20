-- Create a secure RPC function to check if an email exists in auth.users
-- This is necessary because Supabase prevents email enumeration by default
-- and hides existence behind generic "Invalid credentials" errors.

CREATE OR REPLACE FUNCTION public.check_email_exists(lookup_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as the definer (postgres role) to access auth.users
SET search_path = public
AS $$
DECLARE
    email_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM auth.users
        WHERE email = lookup_email
    ) INTO email_exists;
    
    RETURN email_exists;
END;
$$;
