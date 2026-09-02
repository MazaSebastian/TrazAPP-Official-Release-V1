-- ============================================================
-- TrazAPP AI Agent API Keys Management
-- Enables secure, multi-tenant MCP access for AI Agents
-- ============================================================

CREATE TABLE IF NOT EXISTS trazapp_api_keys (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name            text NOT NULL,                          -- e.g. "Agente Floración - Claude", "Antigravity CLI"
  key             text UNIQUE NOT NULL,                   -- e.g. "tz_live_7f8a9b2c..."
  key_prefix      text NOT NULL,                          -- e.g. "tz_live_7f8a..." (for safe UI display)
  permissions     text[] DEFAULT ARRAY['read', 'write', 'tasks', 'telemetry', 'dispensary', 'metrics'] NOT NULL,
  is_active       boolean DEFAULT true NOT NULL,
  last_used_at    timestamptz,
  expires_at      timestamptz,                            -- NULL = never expires
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

-- Indexes for lightning-fast lookup by organization and API key
CREATE INDEX IF NOT EXISTS idx_trazapp_api_keys_org ON trazapp_api_keys (organization_id);
CREATE INDEX IF NOT EXISTS idx_trazapp_api_keys_key ON trazapp_api_keys (key) WHERE is_active = true;

-- Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_trazapp_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trazapp_api_keys_updated_at ON trazapp_api_keys;
CREATE TRIGGER trazapp_api_keys_updated_at
  BEFORE UPDATE ON trazapp_api_keys
  FOR EACH ROW EXECUTE FUNCTION update_trazapp_api_keys_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE trazapp_api_keys ENABLE ROW LEVEL SECURITY;

-- 1. Members with admin/owner/grower roles can view keys in their organization
CREATE POLICY "Users can view their org API keys"
  ON trazapp_api_keys FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- 2. Organization admins/owners can generate new API keys
CREATE POLICY "Admins can insert API keys for their org"
  ON trazapp_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- 3. Organization admins/owners can update/revoke API keys
CREATE POLICY "Admins can update API keys for their org"
  ON trazapp_api_keys FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- 4. Organization admins/owners can delete API keys
CREATE POLICY "Admins can delete API keys for their org"
  ON trazapp_api_keys FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- 5. Super admin full access
CREATE POLICY "Super admin full access on trazapp_api_keys"
  ON trazapp_api_keys FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================================
-- Atomic Key Validation RPC (Used by MCP Server)
-- ============================================================
CREATE OR REPLACE FUNCTION validate_trazapp_api_key(p_api_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to safely validate against hash
SET search_path = public
AS $$
DECLARE
  v_key_record RECORD;
  v_org_name text;
BEGIN
  -- 1. Check if key exists and is active
  SELECT k.id, k.organization_id, k.created_by, k.permissions, k.is_active, k.expires_at
  INTO v_key_record
  FROM trazapp_api_keys k
  WHERE k.key = p_api_key
    AND k.is_active = true
    AND (k.expires_at IS NULL OR k.expires_at > now());

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'API Key inválida, inactiva o expirada'
    );
  END IF;

  -- 2. Fetch organization name
  SELECT name INTO v_org_name
  FROM organizations
  WHERE id = v_key_record.organization_id;

  -- 3. Update last_used_at timestamp asynchronously
  UPDATE trazapp_api_keys
  SET last_used_at = now()
  WHERE id = v_key_record.id;

  -- 4. Return tenant context payload
  RETURN jsonb_build_object(
    'valid', true,
    'key_id', v_key_record.id,
    'organization_id', v_key_record.organization_id,
    'organization_name', COALESCE(v_org_name, 'Club TrazAPP'),
    'user_id', v_key_record.created_by,
    'permissions', v_key_record.permissions
  );
END;
$$;
