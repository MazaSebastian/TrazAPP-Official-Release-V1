-- ============================================================
-- TrazAPP Hardware Devices Registry
-- Stores all physical sensor devices manufactured in-house
-- ============================================================

CREATE TABLE IF NOT EXISTS trazapp_devices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id       text UNIQUE NOT NULL,          -- "TrazApp_A5F4" — printed on device
  device_token    text NOT NULL,                 -- Hardware auth token (from ESP32 MAC-based identity)
  pin             text NOT NULL,                 -- 6-digit pairing PIN (shown on device screen)
  alias           text,                          -- User-friendly name: "Sala Flor 1"
  firmware        text,                          -- Last reported firmware version
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  room_id         uuid REFERENCES rooms(id) ON DELETE SET NULL,
  last_seen_at    timestamptz,                   -- Last telemetry received at
  last_reading    jsonb,                         -- Full snapshot of last payload
  is_active       boolean DEFAULT true NOT NULL,
  is_provisioned  boolean DEFAULT false NOT NULL, -- true = linked to a user/org
  notes           text,                          -- Internal admin notes (repair, model, etc.)
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

-- Index for fast lookup by organization
CREATE INDEX IF NOT EXISTS idx_trazapp_devices_org ON trazapp_devices (organization_id);
CREATE INDEX IF NOT EXISTS idx_trazapp_devices_room ON trazapp_devices (room_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_trazapp_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trazapp_devices_updated_at ON trazapp_devices;
CREATE TRIGGER trazapp_devices_updated_at
  BEFORE UPDATE ON trazapp_devices
  FOR EACH ROW EXECUTE FUNCTION update_trazapp_devices_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE trazapp_devices ENABLE ROW LEVEL SECURITY;

-- Users can see devices linked to their organization
CREATE POLICY "Users can view their org devices"
  ON trazapp_devices FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Only the Super Admin (via service role / Edge Function) can INSERT new devices.
-- The link-device API route will use service_role to assign org_id after PIN verification.

-- Users can update their own org's devices (alias, room assignment, or unlink device)
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

-- Admin role: Full access (for the super-admin panel)
CREATE POLICY "Super admin full access"
  ON trazapp_devices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
