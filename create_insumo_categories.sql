-- 1. Create the new categories table
CREATE TABLE IF NOT EXISTS public.chakra_insumo_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (id)
);

-- 2. Add RLS Policies
ALTER TABLE public.chakra_insumo_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.chakra_insumo_categories
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for org members" ON public.chakra_insumo_categories
    FOR INSERT WITH CHECK (
      auth.uid() IN ( SELECT user_id FROM organization_members WHERE organization_id = chakra_insumo_categories.organization_id )
    );

CREATE POLICY "Enable delete for org members" ON public.chakra_insumo_categories
    FOR DELETE USING (
      auth.uid() IN ( SELECT user_id FROM organization_members WHERE organization_id = chakra_insumo_categories.organization_id )
    );

CREATE POLICY "Enable update for org members" ON public.chakra_insumo_categories
    FOR UPDATE USING (
      auth.uid() IN ( SELECT user_id FROM organization_members WHERE organization_id = chakra_insumo_categories.organization_id )
    );

-- 3. Data Migration: Port existing unique categories from chakra_stock_items to chakra_insumo_categories per organization
INSERT INTO public.chakra_insumo_categories (organization_id, name)
SELECT DISTINCT organization_id, categoria
FROM public.chakra_stock_items
WHERE categoria IS NOT NULL
ON CONFLICT DO NOTHING;
