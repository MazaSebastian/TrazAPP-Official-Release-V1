-- Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    price numeric DEFAULT 0,
    limits jsonb DEFAULT '{}'::jsonb,
    features jsonb DEFAULT '[]'::jsonb,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Turn on RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access to plans" ON public.plans
    FOR SELECT USING (true);

-- Allow write access only to admins (assuming you have an admin role or check)
-- Adjust this policy based on your actual auth setup
CREATE POLICY "Allow admin write access to plans" ON public.plans
    FOR ALL USING (auth.role() = 'service_role'); 
    -- Or specific user role check: (auth.jwt() ->> 'role' = 'admin')

-- Insert default plans
INSERT INTO public.plans (name, slug, price, limits, features) VALUES
('Free Tier', 'free', 0, '{"max_users": 1, "max_storage_gb": 0.5}', '["basic_dashboard", "limited_history"]'),
('Pro Plan', 'pro', 25, '{"max_users": 5, "max_storage_gb": 10}', '["advanced_dashboard", "full_history", "api_access"]'),
('Enterprise', 'enterprise', 99, '{"max_users": 999, "max_storage_gb": 100}', '["all_features", "dedicated_support"]')
ON CONFLICT (slug) DO NOTHING;

-- Update organizations table to reference plans (optional foreign key)
-- We keep the existing 'plan' column but ensure it matches a slug
-- ALTER TABLE public.organizations ADD CONSTRAINT fk_plan FOREIGN KEY (plan) REFERENCES public.plans(slug);
