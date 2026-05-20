-- ============================================================
-- TrazAPP Telemetry Logs
-- Time-series table for all sensor readings from ESP32 devices
-- ============================================================

CREATE TABLE IF NOT EXISTS trazapp_telemetry_logs (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  device_id       text NOT NULL REFERENCES trazapp_devices(device_id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,

  -- Sensor Data
  temp_c          numeric(6,2),
  hum_pct         numeric(5,2),
  soil_pct        numeric(5,2),
  vpd_kpa         numeric(6,3),

  -- VPD Stage Info
  vpd_stage       int,
  vpd_stage_name  text,           -- "VEGE" | "FLOR"
  vpd_in_range    boolean,
  vpd_low         boolean,
  vpd_min         numeric(6,3),
  vpd_max         numeric(6,3),

  -- Device Metadata
  firmware        text,
  uptime_s        bigint,
  rssi_dbm        int,

  -- Sensor quality flags
  temp_real       boolean DEFAULT true,
  hum_real        boolean DEFAULT true,
  soil_real       boolean DEFAULT true,

  recorded_at     timestamptz DEFAULT now() NOT NULL
);

-- Efficient time-series queries (device + time range)
CREATE INDEX IF NOT EXISTS idx_telemetry_device_time
  ON trazapp_telemetry_logs (device_id, recorded_at DESC);

-- Efficient org-level queries
CREATE INDEX IF NOT EXISTS idx_telemetry_org
  ON trazapp_telemetry_logs (organization_id, recorded_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE trazapp_telemetry_logs ENABLE ROW LEVEL SECURITY;

-- Users can read telemetry from their org's devices
CREATE POLICY "Users can read their org telemetry"
  ON trazapp_telemetry_logs FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Super admin full access
CREATE POLICY "Super admin full access telemetry"
  ON trazapp_telemetry_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================================
-- Optional: Auto-purge old data after 90 days (requires pg_cron extension)
-- Uncomment if pg_cron is enabled in your Supabase project.
-- ============================================================

-- SELECT cron.schedule(
--   'purge-old-telemetry',
--   '0 3 * * *',
--   $$DELETE FROM trazapp_telemetry_logs WHERE recorded_at < now() - interval '90 days'$$
-- );
