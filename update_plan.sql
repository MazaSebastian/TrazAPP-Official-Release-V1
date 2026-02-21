-- Update the limits of the ONG plan to 10 users
UPDATE public.plans 
SET limits = '{"max_users": 10, "max_storage_gb": 100}'::jsonb 
WHERE slug = 'ong';
