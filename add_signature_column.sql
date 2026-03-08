-- This script adds the missing 'professional_signature_url' column to the 'profiles' table.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS professional_signature_url TEXT;

-- Let's also verify/add a comment to the column for future developers
COMMENT ON COLUMN public.profiles.professional_signature_url IS 'URL of the uploaded professional signature image from the signatures bucket';
