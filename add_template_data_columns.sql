-- Migration: Add template columns to clinical_evolutions

ALTER TABLE public.clinical_evolutions
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.clinical_templates(id),
ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}'::jsonb;

-- Optional: If you want to document the purpose of the columns
COMMENT ON COLUMN public.clinical_evolutions.template_id IS 'Reference to the clinical template used for this evolution';
COMMENT ON COLUMN public.clinical_evolutions.template_data IS 'JSONB storage for the dynamic answers corresponding to the template fields';
