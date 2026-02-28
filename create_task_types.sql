-- Migration: Create task_types table

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.task_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT, -- Optional hex color for badges
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, name) -- Prevent duplicate task names within the same org
);

-- 2. Setup Row Level Security (RLS)
ALTER TABLE public.task_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task types of their organization"
    ON public.task_types FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Owners and Growers can insert task types"
    ON public.task_types FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'grower')
    ));

CREATE POLICY "Owners and Growers can update task types"
    ON public.task_types FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'grower')
    ));

CREATE POLICY "Owners and Growers can delete task types"
    ON public.task_types FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'grower')
    ));

-- 3. Seed default task types for existing organizations
DO $$
DECLARE
    org RECORD;
    default_types TEXT[] := ARRAY['Info', 'Riego', 'Fertilizar', 'Defoliación', 'Poda Apical', 'HST', 'LST', 'Entrenamiento', 'Esquejes', 'Alerta'];
    t_name TEXT;
BEGIN
    FOR org IN SELECT id FROM public.organizations LOOP
        FOREACH t_name IN ARRAY default_types LOOP
            INSERT INTO public.task_types (organization_id, name)
            VALUES (org.id, t_name)
            ON CONFLICT (organization_id, name) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;
