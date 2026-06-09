-- Add follows_treatment column to aurora_patients table
ALTER TABLE public.aurora_patients
ADD COLUMN IF NOT EXISTS follows_treatment BOOLEAN DEFAULT TRUE;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
