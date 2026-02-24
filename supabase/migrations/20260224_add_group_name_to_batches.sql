-- Add group_name column to batches for grouping multiple clones into a new virtual parent batch
ALTER TABLE public.batches
ADD COLUMN IF NOT EXISTS group_name TEXT;
