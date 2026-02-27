-- =========================================================================================
-- Desvincular Perfil Público y Membresías Puras (El último eslabón de registros nuevos)
-- Solución final para cuentas recién registradas vacías
-- =========================================================================================

DO $$
BEGIN

  -- 1. Perfil Público Principal (Se crea apenas se registra un usuario)
  -- Buscamos dinámicamente el nombre de la constraint que une profiles.id con auth.users
  -- Usualmente se llama profiles_id_fkey
  IF EXISTS (SELECT 1 FROM information_schema.key_column_usage WHERE constraint_name = 'profiles_id_fkey') THEN
      ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
      ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- 2. Membresías a Organizaciones Base (SaaS Multi-tenant)
  IF EXISTS (SELECT 1 FROM information_schema.key_column_usage WHERE constraint_name = 'organization_members_user_id_fkey') THEN
      ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey;
      ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- 3. Organización Invites (Gente que invitó a otros usuarios)
  IF EXISTS (SELECT 1 FROM information_schema.key_column_usage WHERE constraint_name = 'organization_invites_created_by_fkey') THEN
      ALTER TABLE public.organization_invites DROP CONSTRAINT IF EXISTS organization_invites_created_by_fkey;
      ALTER TABLE public.organization_invites ADD CONSTRAINT organization_invites_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

END $$;
