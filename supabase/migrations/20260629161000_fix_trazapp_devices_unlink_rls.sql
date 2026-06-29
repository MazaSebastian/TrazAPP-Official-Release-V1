-- Migration: Fix RLS for unlinking trazapp_devices
-- Description: Drop all existing RLS policies on trazapp_devices and recreate them,
--              ensuring the FOR UPDATE policy allows organization_id to be NULL (unlinked).

DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'trazapp_devices' 
          AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY %I ON trazapp_devices', pol.policyname);
    END LOOP;
END $$;

-- 1. Users can view their org devices
CREATE POLICY "Users can view their org devices"
  ON trazapp_devices FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- 2. Users can update their own org's devices (alias, room assignment, or unlink device)
CREATE POLICY "Users can update their org devices"
  ON trazapp_devices FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IS NULL OR
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- 3. Super admin full access
CREATE POLICY "Super admin full access"
  ON trazapp_devices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
