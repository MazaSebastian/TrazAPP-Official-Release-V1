-- Phase 2: Security & Isolation (RLS)
-- Objective: Ensure users only access data from their organizations

-- 1. Helper Function to get user's organizations
-- This avoids repeating the subquery in every policy
CREATE OR REPLACE FUNCTION get_my_org_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY SELECT organization_id FROM public.organization_members
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Apply Policies to Business Tables
-- We iterate over all tables and apply the "Tenant Isolation" policy

-- Policy Template:
-- CREATE POLICY "Tenant Isolation" ON table_name
-- FOR ALL
-- USING ( organization_id IN (SELECT get_my_org_ids()) )
-- WITH CHECK ( organization_id IN (SELECT get_my_org_ids()) );

-- Helper block to apply this to all known tables
DO $$
DECLARE
    tbl TEXT;
    policy_name TEXT := 'Tenant Isolation';
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('rooms', 'batches', 'genetics', 'chakra_crops', 'chakra_tasks', 'chakra_daily_logs', 'chakra_stock_items', 'chakra_historial_precios', 'chakra_dispensary_batches', 'chakra_harvest_logs', 'chakra_extractions', 'expenses', 'compras', 'stickies', 'announcements', 'activities')
    LOOP
        -- Drop if exists to avoid errors on retry
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, tbl);
        
        -- Create Policy
        EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (organization_id IN (SELECT get_my_org_ids())) WITH CHECK (organization_id IN (SELECT get_my_org_ids()))', policy_name, tbl, tbl);
        
        -- Generate explicit Enable RLS (just in case)
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
END $$;

-- 3. Update Policies for Organizations & Members
-- Members can view their own memberships
DROP POLICY IF EXISTS "Members can view own memberships" ON public.organization_members;
CREATE POLICY "Members can view own memberships" ON public.organization_members
FOR SELECT USING (user_id = auth.uid());

-- Members can view organizations they belong to
DROP POLICY IF EXISTS "Members can view own organizations" ON public.organizations;
CREATE POLICY "Members can view own organizations" ON public.organizations
FOR SELECT USING (id IN (SELECT get_my_org_ids()));

-- Remove temporary open policies if they exist (from setup_organizations.sql)
DROP POLICY IF EXISTS "Enable all access for now" ON public.organizations;
DROP POLICY IF EXISTS "Enable all access for now" ON public.organization_members;
