-- =========================================================================================
-- Desvincular rastros de auditoría (Audit Trails) para permitir el borrado de usuarios
-- =========================================================================================

-- 1. harvest logs (Cosechas)
ALTER TABLE public.chakra_harvest_logs DROP CONSTRAINT IF EXISTS chakra_harvest_logs_logged_by_fkey;
ALTER TABLE public.chakra_harvest_logs ADD CONSTRAINT chakra_harvest_logs_logged_by_fkey FOREIGN KEY (logged_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. chakra_crops (Cultivos)
ALTER TABLE public.chakra_crops DROP CONSTRAINT IF EXISTS chakra_crops_user_id_fkey;
ALTER TABLE public.chakra_crops ADD CONSTRAINT chakra_crops_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. chakra_dispensary_movements (Movimientos de Dispensario)
ALTER TABLE public.chakra_dispensary_movements DROP CONSTRAINT IF EXISTS chakra_dispensary_movements_performed_by_fkey;
ALTER TABLE public.chakra_dispensary_movements ADD CONSTRAINT chakra_dispensary_movements_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. app_members (Membresías core)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'app_members') THEN
      ALTER TABLE public.app_members DROP CONSTRAINT IF EXISTS app_members_user_id_fkey;
      ALTER TABLE public.app_members ADD CONSTRAINT app_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
