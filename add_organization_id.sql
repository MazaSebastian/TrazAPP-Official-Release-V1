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
