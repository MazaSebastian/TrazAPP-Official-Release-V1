-- Add KYC columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS document_number text,
ADD COLUMN IF NOT EXISTS cuil text,
ADD COLUMN IF NOT EXISTS phone_mobile text,
ADD COLUMN IF NOT EXISTS phone_landline text,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS kyc_completed boolean DEFAULT false;

-- Add KYC company columns to organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS company_cuit text,
ADD COLUMN IF NOT EXISTS company_legal_name text,
ADD COLUMN IF NOT EXISTS company_email text,
ADD COLUMN IF NOT EXISTS address_province text,
ADD COLUMN IF NOT EXISTS address_department text,
ADD COLUMN IF NOT EXISTS address_locality text,
ADD COLUMN IF NOT EXISTS address_zip text,
ADD COLUMN IF NOT EXISTS address_street text,
ADD COLUMN IF NOT EXISTS address_number text,
ADD COLUMN IF NOT EXISTS address_floor_apt text,
ADD COLUMN IF NOT EXISTS legal_documents jsonb DEFAULT '{}'::jsonb;
