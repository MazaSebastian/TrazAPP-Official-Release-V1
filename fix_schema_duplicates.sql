-- Limpieza de esquema y unificación de tablas
-- Objetivo: Eliminar ambigüedad entre 'tasks'/'daily_records' y 'chakra_tasks'/'chakra_daily_logs'

-- 1. Eliminar tablas duplicadas/no usadas (si existen y están vacías o son de prueba)
-- PRECAUCIÓN: Asegurarse de que no tengan datos valiosos. En este punto asumimos migración nueva.
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.daily_records CASCADE;
DROP TABLE IF EXISTS public.planned_events CASCADE;

-- 2. Asegurar que las tablas reales existan (ya deberían por SCHEMA_SETUP.sql)
-- public.chakra_tasks
-- public.chakra_daily_logs
-- public.activities

-- 3. Actualizar o Recrear Triggers para apuntar a las tablas correctas

-- Trigger para nuevas tareas (apuntando a chakra_tasks)
CREATE OR REPLACE FUNCTION notify_new_task()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM send_push_notification(
    title := 'Nueva Tarea',
    body := NEW.title || ' - ' || COALESCE(NEW.type, 'General'), -- chakra_tasks tiene 'type', no 'cropName' directo a veces
    url := 'https://crop-crm.vercel.app/tasks'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_task ON public.chakra_tasks;
CREATE TRIGGER trigger_notify_new_task
  AFTER INSERT ON public.chakra_tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_task();

-- Trigger para nuevos registros diarios (apuntando a chakra_daily_logs)
CREATE OR REPLACE FUNCTION notify_new_daily_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM send_push_notification(
    title := 'Nuevo Registro Diario',
    body := NEW.date || ' - ' || COALESCE(NEW.notes, ''), 
    url := 'https://crop-crm.vercel.app/daily-log'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_daily_record ON public.chakra_daily_logs;
CREATE TRIGGER trigger_notify_new_daily_record
  AFTER INSERT ON public.chakra_daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_daily_record();

-- Nota: planned_events se eliminó porque no tiene equivalente 'chakra_'. 
-- Si se necesita, se debería crear 'chakra_planned_events'. Por ahora lo omitimos para limpiar.
