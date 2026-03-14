-- Update the DEMO plan to strictly allow only 1 user and 1 room/crop
UPDATE public.plans 
SET 
  limits = '{"max_users": 1, "max_rooms": 1, "max_batches": 100}'::jsonb
WHERE 
  slug = 'demo';
