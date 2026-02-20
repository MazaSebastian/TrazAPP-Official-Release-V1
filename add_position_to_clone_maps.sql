-- Add position columns to clone_maps for Freestyle layout
ALTER TABLE public.clone_maps
ADD COLUMN IF NOT EXISTS position_x FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS position_y FLOAT DEFAULT 0;

-- Optional: Add width/height if we want resizable maps later
-- ALTER TABLE public.clone_maps ADD COLUMN IF NOT EXISTS width FLOAT DEFAULT 300;
-- ALTER TABLE public.clone_maps ADD COLUMN IF NOT EXISTS height FLOAT DEFAULT 200;
