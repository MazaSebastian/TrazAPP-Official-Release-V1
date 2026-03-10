-- Inserts the trazapp plan into the plans table if it does not exist
INSERT INTO plans (name, description, slug, features, price, stripe_price_id, limits, level, active)
SELECT 
    'TrazAPP', 
    'Plan TrazAPP con IA Growy', 
    'trazapp', 
    '["IA Growy", "Gestión ONG", "ILimitado"]'::jsonb, 
    0, 
    '', 
    '{"max_users": 10, "max_crops": 8, "max_storage_mb": 5000}'::jsonb, 
    4, 
    true
WHERE NOT EXISTS (
    SELECT 1 FROM plans WHERE slug = 'trazapp'
);
