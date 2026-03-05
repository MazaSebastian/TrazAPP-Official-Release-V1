-- Add pre_flowering_days column to rooms
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS pre_flowering_days integer DEFAULT NULL;

-- Optionally add a helpful comment to the column
COMMENT ON COLUMN public.rooms.pre_flowering_days IS 'Optional number of days for pre-flowering or adaptation phase before the main operational days count starts.';
