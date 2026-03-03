ALTER TABLE clinical_evolutions ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT '{}';
