-- Add missing profile fields to aurora_patients table

ALTER TABLE public.aurora_patients
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS pathology TEXT;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
