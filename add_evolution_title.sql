-- Adds a brief descriptive title to clinical evolutions
ALTER TABLE clinical_evolutions
ADD COLUMN IF NOT EXISTS title TEXT;
