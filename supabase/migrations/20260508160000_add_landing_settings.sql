-- Add JSONB column for landing page customization
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS landing_settings JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.organizations.landing_settings IS 'Configuración de textos y fondo para la Landing Page pública (Mi Web)';
