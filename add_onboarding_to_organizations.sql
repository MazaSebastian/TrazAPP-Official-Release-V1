-- Add onboarding state and custom enabled modules to the organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enabled_modules JSONB DEFAULT null;

-- Update RLS or policies if needed (usually public.organizations permits read/write for organization owners)
