-- ============================================================
-- TrazAPP Migration: Bunker & Device Linkage Extensions
-- Purpose: Adds bunker_name and device_type to trazapp_devices
-- Safe & Idempotent (Will not modify existing records)
-- ============================================================

-- 1. Add bunker_name column if it does not exist
ALTER TABLE public.trazapp_devices
ADD COLUMN IF NOT EXISTS bunker_name text;

-- 2. Add device_type column if it does not exist
-- Allowed types: 'sensor' (e.g. TrazApp Sense 3.5"), 'mother_tablet' (ESP32-S3 7"), 'camera', 'actuator'
ALTER TABLE public.trazapp_devices
ADD COLUMN IF NOT EXISTS device_type text DEFAULT 'sensor';

-- 3. Add index for fast querying of devices per room & bunker
CREATE INDEX IF NOT EXISTS idx_trazapp_devices_room_bunker 
ON public.trazapp_devices (room_id, bunker_name);

-- 4. Ensure RLS permits reading & updating devices within user's organization
-- (Uses existing trazapp_devices RLS policies created in setup_trazapp_devices.sql)
