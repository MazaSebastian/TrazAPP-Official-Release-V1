-- Migration to add DNI and REPROCANN back document fields for patient KYC

ALTER TABLE public.aurora_patients
ADD COLUMN IF NOT EXISTS file_dni_front_url text,
ADD COLUMN IF NOT EXISTS file_dni_back_url text,
ADD COLUMN IF NOT EXISTS file_reprocann_back_url text;

-- (The field file_reprocann_url already exists and will be considered the "front")
