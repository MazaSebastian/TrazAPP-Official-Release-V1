-- Add unit_volume and unit_volume_type to chakra_dispensary_batches
ALTER TABLE chakra_dispensary_batches 
ADD COLUMN IF NOT EXISTS unit_volume numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS unit_volume_type text DEFAULT NULL;

-- Ensure all existing non-flower products have 'u' as unit to migrate to discrete logic
UPDATE chakra_dispensary_batches
SET unit = 'u'
WHERE product_type != 'flower';
