-- Add new columns for Multi-Product Dispensary Scaling
ALTER TABLE chakra_dispensary_batches 
ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) DEFAULT 'flower',
ADD COLUMN IF NOT EXISTS unit VARCHAR(10) DEFAULT 'g',
ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);

-- Make sure existing rows default to 'flower' and 'g' logically, 
-- though the DEFAULT constraints take care of new rows. 
-- For existing rows, we can force them just in case:
UPDATE chakra_dispensary_batches
SET product_type = 'flower', unit = 'g'
WHERE product_type IS NULL OR unit IS NULL;
