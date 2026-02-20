-- Add photo_url column to chakra_dispensary_batches
ALTER TABLE chakra_dispensary_batches
ADD COLUMN IF NOT EXISTS photo_url TEXT;
