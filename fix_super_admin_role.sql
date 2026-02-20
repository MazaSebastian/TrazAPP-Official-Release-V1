-- 1. Inspect and Fix Table Structure
-- We ensure the 'role' column exists. We verify other columns later by usage, but 'role' is critical.
DO $$
BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'partner';
    END IF;
END $$;

-- 2. Update Super Admin
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'trazappadmin@admin.com';

    IF admin_user_id IS NOT NULL THEN
        -- We try to insert/update. We only use ID and ROLE since 'nombre'/'email' failed.
        -- If the row doesn't exist, we insert just ID and Role.
        INSERT INTO public.profiles (id, role)
        VALUES (admin_user_id, 'super_admin')
        ON CONFLICT (id) DO UPDATE
        SET role = 'super_admin';
        
        RAISE NOTICE 'SUCCESS: Super Admin role assigned to %', admin_user_id;
    ELSE
        RAISE WARNING 'User trazappadmin@admin.com not found. Please create user in Authentication tab first.';
    END IF;
END $$;
