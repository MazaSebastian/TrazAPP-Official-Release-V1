-- Insert the missing DEMO plan into the plans table
INSERT INTO public.plans (name, slug, price, features, limits, active)
VALUES (
    'Demo (15 Días)',
    'demo',
    0.00,
    '["Gestión TrazAPP Completa", "Soporte Técnico Especializado", "1 Usuario Máximo", "Clínica + Cultivo"]'::jsonb,
    '{"max_users": 1, "max_rooms": 1, "max_batches": 1000}'::jsonb,
    true
)
ON CONFLICT (slug) DO UPDATE
SET 
    limits = EXCLUDED.limits,
    features = EXCLUDED.features;
