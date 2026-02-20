-- Rename plans and migrate existing organizations

-- 1. Update Plans
UPDATE public.plans SET slug = 'individual', name = 'Individual' WHERE slug = 'free';
UPDATE public.plans SET slug = 'equipo', name = 'Equipo' WHERE slug = 'pro';
UPDATE public.plans SET slug = 'ong', name = 'ONG' WHERE slug = 'enterprise';

-- 2. Update Organizations references
UPDATE public.organizations SET plan = 'individual' WHERE plan = 'free';
UPDATE public.organizations SET plan = 'equipo' WHERE plan = 'pro';
UPDATE public.organizations SET plan = 'ong' WHERE plan = 'enterprise';

-- 3. Insert if they didn't exist (e.g. if the previous migration wasn't fully applied or rows deleted)
INSERT INTO public.plans (name, slug, price, limits, features)
SELECT 'Individual', 'individual', 0, '{"max_users": 1, "max_storage_gb": 0.5}', '["basic_dashboard"]'
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'individual');

INSERT INTO public.plans (name, slug, price, limits, features)
SELECT 'Equipo', 'equipo', 25, '{"max_users": 5, "max_storage_gb": 10}', '["advanced_dashboard"]'
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'equipo');

INSERT INTO public.plans (name, slug, price, limits, features)
SELECT 'ONG', 'ong', 0, '{"max_users": 999, "max_storage_gb": 100}', '["all_features"]'
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'ong');
