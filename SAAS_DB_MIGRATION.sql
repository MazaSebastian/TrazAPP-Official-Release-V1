-- 1. Tabla de Organizaciones (Los Clientes)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE, -- para URLs amigables (ej: app.com/aurora)
    plan TEXT DEFAULT 'free', -- free, pro, enterprise
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Tabla de Miembros (User <-> Organization)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    role TEXT DEFAULT 'staff', -- owner, admin, staff, viewer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Habilitar RLS en organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Políticas temporales para permitir la inserción inicial (se ajustarán en Phase 2)
CREATE POLICY "Enable all access for now" ON public.organizations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for now" ON public.organization_members FOR ALL USING (true) WITH CHECK (true);
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
-- Agregar columna organization_id a todas las tablas de negocio
-- Referencia a public.organizations(id)

-- 1. Rooms
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 2. Batches
ALTER TABLE public.batches 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 3. Genetics
ALTER TABLE public.genetics 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 4. Chakra Crops
ALTER TABLE public.chakra_crops 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 5. Chakra Tasks
ALTER TABLE public.chakra_tasks 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 6. Chakra Daily Logs
ALTER TABLE public.chakra_daily_logs 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 7. Chakra Stock Items (Insumos)
ALTER TABLE public.chakra_stock_items 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 8. Chakra Historial Precios
ALTER TABLE public.chakra_historial_precios 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 9. Chakra Dispensary Batches
ALTER TABLE public.chakra_dispensary_batches 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 10. Chakra Harvest Logs
ALTER TABLE public.chakra_harvest_logs 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 11. Chakra Extractions
ALTER TABLE public.chakra_extractions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 12. Expenses
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 13. Compras
ALTER TABLE public.compras 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 14. Stickies
ALTER TABLE public.stickies 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 15. Announcements
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 16. Activities
ALTER TABLE public.activities 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Índices (Recomendado para performance de RLS)
CREATE INDEX IF NOT EXISTS idx_rooms_org ON public.rooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_batches_org ON public.batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_genetics_org ON public.genetics(organization_id);
CREATE INDEX IF NOT EXISTS idx_chakra_crops_org ON public.chakra_crops(organization_id);
CREATE INDEX IF NOT EXISTS idx_chakra_tasks_org ON public.chakra_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_chakra_daily_logs_org ON public.chakra_daily_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_chakra_stock_items_org ON public.chakra_stock_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_chakra_dispensary_batches_org ON public.chakra_dispensary_batches(organization_id);
-- Script para migrar datos existentes a Organizaciones
-- Se asume que cada usuario existente tendrá su propia organización "Personal"

DO $$
DECLARE
    user_record RECORD;
    new_org_id UUID;
BEGIN
    -- 1. Iterar sobre todos los usuarios en auth.users
    FOR user_record IN SELECT * FROM auth.users LOOP
        
        -- Verificar si el usuario ya tiene una organización (para no duplicar si se corre 2 veces)
        SELECT organization_id INTO new_org_id 
        FROM public.organization_members 
        WHERE user_id = user_record.id 
        LIMIT 1;

        -- Si no tiene, crearla
        IF new_org_id IS NULL THEN
            INSERT INTO public.organizations (name, plan) 
            VALUES ('Org de ' || COALESCE(user_record.email, 'Usuario'), 'free')
            RETURNING id INTO new_org_id;

            -- Asignar usuario como Owner
            INSERT INTO public.organization_members (organization_id, user_id, role)
            VALUES (new_org_id, user_record.id, 'owner');
        END IF;

        -- 2. Asignar datos "Huérfanos" (que no tienen org_id) creados por este usuario
        -- Esto asume que las tablas tienen columna 'created_by' o similar.
        -- Si no tienen, se quedarán NULL hasta asignación manual o estrategia diferente.
        
        -- Ejemplo: Rooms (no tienen created_by usualmente, pero si es single tenant ad-hoc...)
        -- Estrategia Fallback: Asignar TODO lo que sea NULL al primer usuario que encontremos (Peligroso en prod real, util en migración dev single-tenant)
        -- Si estás seguro de que es single-tenant migracion, y este es EL usuario admin:
        
        -- UPDATE public.rooms SET organization_id = new_org_id WHERE organization_id IS NULL;
        
    END LOOP;
END $$;

-- ESTRATEGIA DE EMERGENCIA PARA SINGLE TENANT -> MULTI TENANT
-- Si esto era una app de un solo dueño, asignamos TODO a la primera organización creada.
DO $$
DECLARE
    first_org_id UUID;
BEGIN
    SELECT id INTO first_org_id FROM public.organizations LIMIT 1;

    IF first_org_id IS NOT NULL THEN
        UPDATE public.rooms SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.batches SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.genetics SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.chakra_crops SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.chakra_tasks SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.chakra_daily_logs SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.chakra_stock_items SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.chakra_historial_precios SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.chakra_dispensary_batches SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.chakra_harvest_logs SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.chakra_extractions SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.expenses SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.compras SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.stickies SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.announcements SET organization_id = first_org_id WHERE organization_id IS NULL;
        UPDATE public.activities SET organization_id = first_org_id WHERE organization_id IS NULL;
    END IF;
END $$;
