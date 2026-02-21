-- Fix the foreign key relationship so Supabase can join organization_members with profiles
DO $$ 
BEGIN
    -- 1. Drop the existing foreign key constraint that points to auth.users (if it exists)
    ALTER TABLE public.organization_members 
    DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey;

    -- 2. Add the correct foreign key constraint pointing to public.profiles
    -- This matches the query: profile:profiles!organization_members_user_id_fkey(...)
    ALTER TABLE public.organization_members
    ADD CONSTRAINT organization_members_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    
END $$;
