-- Migration: Create clinical_templates table

CREATE TABLE IF NOT EXISTS public.clinical_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.clinical_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view templates of their organization" ON public.clinical_templates;
CREATE POLICY "Users can view templates of their organization" 
ON public.clinical_templates FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = clinical_templates.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert templates for their organization" ON public.clinical_templates;
CREATE POLICY "Users can insert templates for their organization" 
ON public.clinical_templates FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = organization_id
    AND organization_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update templates of their organization" ON public.clinical_templates;
CREATE POLICY "Users can update templates of their organization" 
ON public.clinical_templates FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = clinical_templates.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete templates of their organization" ON public.clinical_templates;
CREATE POLICY "Users can delete templates of their organization" 
ON public.clinical_templates FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = clinical_templates.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_clinical_templates_modtime ON public.clinical_templates;
CREATE TRIGGER update_clinical_templates_modtime 
BEFORE UPDATE ON public.clinical_templates 
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
