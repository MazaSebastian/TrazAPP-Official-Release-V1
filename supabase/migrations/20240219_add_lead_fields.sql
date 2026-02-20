-- Add new columns for lead capture
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS referral_source text,
ADD COLUMN IF NOT EXISTS owner_name text; -- To store the full name if it's different from organization name (or used as context)

-- Optional: Add constraint to referral_source if you want strict values
-- ALTER TABLE public.organizations ADD CONSTRAINT check_referral_source CHECK (referral_source IN ('recommendation', 'social_media', 'web_search', 'other'));
