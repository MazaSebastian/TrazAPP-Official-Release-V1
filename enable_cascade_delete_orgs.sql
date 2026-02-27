-- Habilitar eliminación en cascada para organizaciones (SaaS Multi-tenant)
-- Ejecutar en el Editor SQL de Supabase

-- 1. members
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_organization_id_fkey;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 2. rooms
ALTER TABLE public.rooms DROP CONSTRAINT IF EXISTS rooms_organization_id_fkey;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 3. batches
ALTER TABLE public.batches DROP CONSTRAINT IF EXISTS batches_organization_id_fkey;
ALTER TABLE public.batches ADD CONSTRAINT batches_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 4. genetics
ALTER TABLE public.genetics DROP CONSTRAINT IF EXISTS genetics_organization_id_fkey;
ALTER TABLE public.genetics ADD CONSTRAINT genetics_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 5. chakra_crops
ALTER TABLE public.chakra_crops DROP CONSTRAINT IF EXISTS chakra_crops_organization_id_fkey;
ALTER TABLE public.chakra_crops ADD CONSTRAINT chakra_crops_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 6. chakra_tasks
ALTER TABLE public.chakra_tasks DROP CONSTRAINT IF EXISTS chakra_tasks_organization_id_fkey;
ALTER TABLE public.chakra_tasks ADD CONSTRAINT chakra_tasks_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 7. chakra_daily_logs
ALTER TABLE public.chakra_daily_logs DROP CONSTRAINT IF EXISTS chakra_daily_logs_organization_id_fkey;
ALTER TABLE public.chakra_daily_logs ADD CONSTRAINT chakra_daily_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 8. chakra_stock_items
ALTER TABLE public.chakra_stock_items DROP CONSTRAINT IF EXISTS chakra_stock_items_organization_id_fkey;
ALTER TABLE public.chakra_stock_items ADD CONSTRAINT chakra_stock_items_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 9. chakra_dispensary_batches
ALTER TABLE public.chakra_dispensary_batches DROP CONSTRAINT IF EXISTS chakra_dispensary_batches_organization_id_fkey;
ALTER TABLE public.chakra_dispensary_batches ADD CONSTRAINT chakra_dispensary_batches_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 10. chakra_harvest_logs
ALTER TABLE public.chakra_harvest_logs DROP CONSTRAINT IF EXISTS chakra_harvest_logs_organization_id_fkey;
ALTER TABLE public.chakra_harvest_logs ADD CONSTRAINT chakra_harvest_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 11. chakra_extractions
ALTER TABLE public.chakra_extractions DROP CONSTRAINT IF EXISTS chakra_extractions_organization_id_fkey;
ALTER TABLE public.chakra_extractions ADD CONSTRAINT chakra_extractions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;



-- 17. chakra_historial_precios
ALTER TABLE public.chakra_historial_precios DROP CONSTRAINT IF EXISTS chakra_historial_precios_organization_id_fkey;
ALTER TABLE public.chakra_historial_precios ADD CONSTRAINT chakra_historial_precios_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Para organization_invites y clinical_templates, ya comprobé que el schema de creación se hizo con ON DELETE CASCADE originalmente, pero lo podemos asegurar si es necesario:
ALTER TABLE public.organization_invites DROP CONSTRAINT IF EXISTS organization_invites_organization_id_fkey;
ALTER TABLE public.organization_invites ADD CONSTRAINT organization_invites_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- =========================================================================================
-- DEPENDENCIAS DE SEGUNDO NIVEL (Tablas "Nietas")
-- Estas tablas no heredan directamente de organizations, pero bloquean el borrado de sus padres.
-- =========================================================================================

-- A. chakra_dispensary_movements (depende de chakra_dispensary_batches)
ALTER TABLE public.chakra_dispensary_movements DROP CONSTRAINT IF EXISTS chakra_dispensary_movements_batch_id_fkey;
ALTER TABLE public.chakra_dispensary_movements ADD CONSTRAINT chakra_dispensary_movements_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.chakra_dispensary_batches(id) ON DELETE CASCADE;
