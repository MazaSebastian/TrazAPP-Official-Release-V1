-- =========================================================================================
-- Desvincular rastros de auditoría (Auditorias Masivas Blindadas)
-- Solución final para roles "Grower" verificando existencia exacta de Foreign Keys
-- =========================================================================================

DO $$
BEGIN

  -- 1. Genetics (Genéticas de Madres y Clones)
  IF EXISTS (SELECT 1 FROM information_schema.key_column_usage WHERE constraint_name = 'genetics_created_by_fkey') THEN
      ALTER TABLE public.genetics DROP CONSTRAINT IF EXISTS genetics_created_by_fkey;
      ALTER TABLE public.genetics ADD CONSTRAINT genetics_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- 2. Stock Items (Insumos General)
  IF EXISTS (SELECT 1 FROM information_schema.key_column_usage WHERE constraint_name = 'chakra_stock_items_logged_by_fkey') THEN
      ALTER TABLE public.chakra_stock_items DROP CONSTRAINT IF EXISTS chakra_stock_items_logged_by_fkey;
      ALTER TABLE public.chakra_stock_items ADD CONSTRAINT chakra_stock_items_logged_by_fkey FOREIGN KEY (logged_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- 3. Batches (Lotes en Salas)
  IF EXISTS (SELECT 1 FROM information_schema.key_column_usage WHERE constraint_name = 'batches_created_by_fkey') THEN
      ALTER TABLE public.batches DROP CONSTRAINT IF EXISTS batches_created_by_fkey;
      ALTER TABLE public.batches ADD CONSTRAINT batches_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- 4. Tareas (Tasks) - Validando ambas variantes posibles
  IF EXISTS (SELECT 1 FROM information_schema.key_column_usage WHERE constraint_name = 'chakra_tasks_assigned_to_fkey') THEN
      ALTER TABLE public.chakra_tasks DROP CONSTRAINT IF EXISTS chakra_tasks_assigned_to_fkey;
      ALTER TABLE public.chakra_tasks ADD CONSTRAINT chakra_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.key_column_usage WHERE constraint_name = 'chakra_tasks_user_id_fkey') THEN
      ALTER TABLE public.chakra_tasks DROP CONSTRAINT IF EXISTS chakra_tasks_user_id_fkey;
      ALTER TABLE public.chakra_tasks ADD CONSTRAINT chakra_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- 5. Daily Logs (Registros Diarios)
  IF EXISTS (SELECT 1 FROM information_schema.key_column_usage WHERE constraint_name = 'chakra_daily_logs_logged_by_fkey') THEN
      ALTER TABLE public.chakra_daily_logs DROP CONSTRAINT IF EXISTS chakra_daily_logs_logged_by_fkey;
      ALTER TABLE public.chakra_daily_logs ADD CONSTRAINT chakra_daily_logs_logged_by_fkey FOREIGN KEY (logged_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.key_column_usage WHERE constraint_name = 'chakra_daily_logs_user_id_fkey') THEN
      ALTER TABLE public.chakra_daily_logs DROP CONSTRAINT IF EXISTS chakra_daily_logs_user_id_fkey;
      ALTER TABLE public.chakra_daily_logs ADD CONSTRAINT chakra_daily_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- 6. Annoucements (Anuncios del Dashboard)
  IF EXISTS (SELECT 1 FROM information_schema.key_column_usage WHERE constraint_name = 'announcements_created_by_fkey') THEN
      ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_created_by_fkey;
      ALTER TABLE public.announcements ADD CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- 7. Tuya Alerts (Notificaciones IoT)
  IF EXISTS (SELECT 1 FROM information_schema.key_column_usage WHERE constraint_name = 'tuya_alerts_user_id_fkey') THEN
      ALTER TABLE public.tuya_alerts DROP CONSTRAINT IF EXISTS tuya_alerts_user_id_fkey;
      ALTER TABLE public.tuya_alerts ADD CONSTRAINT tuya_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

END $$;
