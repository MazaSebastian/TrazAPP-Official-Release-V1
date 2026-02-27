-- =========================================================================================
-- Desvincular rastros de auditoría (Plantillas Médicas) faltantes 
-- =========================================================================================

-- 1. clinical_templates (Plantillas guardadas por los doctores)
ALTER TABLE public.clinical_templates DROP CONSTRAINT IF EXISTS clinical_templates_created_by_fkey;
ALTER TABLE public.clinical_templates ADD CONSTRAINT clinical_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
