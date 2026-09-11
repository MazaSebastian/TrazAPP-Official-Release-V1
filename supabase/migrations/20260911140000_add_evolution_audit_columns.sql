-- Migration: Add audit columns to clinical_evolutions for tracking edits
ALTER TABLE public.clinical_evolutions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_by TEXT,
ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.clinical_evolutions.updated_at IS 'Timestamp of the latest modification to this medical evolution';
COMMENT ON COLUMN public.clinical_evolutions.updated_by IS 'Full name, email or identifier of the user/physician who performed the latest modification';
COMMENT ON COLUMN public.clinical_evolutions.edit_history IS 'Audit log array storing previous revisions and metadata';
