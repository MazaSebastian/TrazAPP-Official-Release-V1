-- Migration to add organization_id to patient-related tables for Multi-Tenancy

-- 1. Add organization_id to aurora_patients
ALTER TABLE public.aurora_patients 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 2. Add organization_id to clinical_evolutions
ALTER TABLE public.clinical_evolutions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 3. Add organization_id to clinical_admissions
ALTER TABLE public.clinical_admissions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Update RLS Policies for aurora_patients
DROP POLICY IF EXISTS "Enable read access for organization users" ON public.aurora_patients;
DROP POLICY IF EXISTS "Enable insert for organization users" ON public.aurora_patients;
DROP POLICY IF EXISTS "Enable update for organization users" ON public.aurora_patients;

CREATE POLICY "Enable read access for organization users" ON public.aurora_patients
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for organization users" ON public.aurora_patients
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable update for organization users" ON public.aurora_patients
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

-- Similar policies for clinical_evolutions
DROP POLICY IF EXISTS "Enable read access for organization users" ON public.clinical_evolutions;
DROP POLICY IF EXISTS "Enable insert for organization users" ON public.clinical_evolutions;
DROP POLICY IF EXISTS "Enable update for organization users" ON public.clinical_evolutions;

CREATE POLICY "Enable read access for organization users" ON public.clinical_evolutions
    FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Enable insert for organization users" ON public.clinical_evolutions
    FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Enable update for organization users" ON public.clinical_evolutions
    FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

-- Similar policies for clinical_admissions
DROP POLICY IF EXISTS "Enable read access for organization users" ON public.clinical_admissions;
DROP POLICY IF EXISTS "Enable insert for organization users" ON public.clinical_admissions;
DROP POLICY IF EXISTS "Enable update for organization users" ON public.clinical_admissions;

CREATE POLICY "Enable read access for organization users" ON public.clinical_admissions
    FOR SELECT USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Enable insert for organization users" ON public.clinical_admissions
    FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Enable update for organization users" ON public.clinical_admissions
    FOR UPDATE USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));
