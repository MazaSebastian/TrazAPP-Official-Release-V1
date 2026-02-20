-- Phase 3 Helper: Add organization_id to missing tables
-- This script fixes tables that were missed or named incorrectly in Phase 1

-- 1. Helper Function (Ensure it exists)
CREATE OR REPLACE FUNCTION get_my_org_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY SELECT organization_id FROM public.organization_members
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add Columns & Indexes
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('chakra_stickies', 'chakra_expenses', 'cash_movements', 'aurora_patients', 'clinical_admissions', 'clinical_evolutions', 'chakra_dispensary_movements', 'batch_movements')
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(tbl) || ' ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_' || tbl || '_org ON public.' || quote_ident(tbl) || '(organization_id);';
    END LOOP;
END $$;

-- 3. Backfill Data (Assign to owner's org or first found org)
-- Needed if there is existing data in these tables
DO $$
DECLARE
    first_org_id UUID;
    tbl TEXT;
BEGIN
    SELECT id INTO first_org_id FROM public.organizations LIMIT 1;
    
    IF first_org_id IS NOT NULL THEN
        FOR tbl IN 
             SELECT tablename FROM pg_tables 
             WHERE schemaname = 'public' 
             AND tablename IN ('chakra_stickies', 'chakra_expenses', 'cash_movements', 'aurora_patients', 'clinical_admissions', 'clinical_evolutions', 'chakra_dispensary_movements', 'batch_movements')
        LOOP
            EXECUTE 'UPDATE public.' || quote_ident(tbl) || ' SET organization_id = $1 WHERE organization_id IS NULL' USING first_org_id;
        END LOOP;
    END IF;
END $$;

-- 4. Apply RLS Policies (Tenant Isolation)
DO $$
DECLARE
    tbl TEXT;
    policy_name TEXT := 'Tenant Isolation';
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('chakra_stickies', 'chakra_expenses', 'cash_movements', 'aurora_patients', 'clinical_admissions', 'clinical_evolutions', 'chakra_dispensary_movements', 'batch_movements')
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

        -- Drop old policies if likely to conflict (optional but safer)
        -- EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, tbl);

        -- Create Policy
        EXECUTE format('
            CREATE POLICY %I ON public.%I 
            FOR ALL 
            USING (organization_id IN (SELECT get_my_org_ids())) 
            WITH CHECK (organization_id IN (SELECT get_my_org_ids()))
        ', policy_name, tbl);
        
    END LOOP;
END $$;
