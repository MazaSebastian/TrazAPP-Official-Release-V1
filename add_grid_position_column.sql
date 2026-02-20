-- Add grid_position column to batches if it doesn't exist
ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS grid_position TEXT;
