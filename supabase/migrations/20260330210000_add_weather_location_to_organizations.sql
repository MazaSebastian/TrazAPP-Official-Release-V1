-- Add weather_location JSONB column to organizations table
-- This replaces the localStorage-only approach to persist location per-org in Supabase

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS weather_location JSONB DEFAULT NULL;

-- Example structure:
-- { "name": "Av. del Libertador 2300, Olivos", "lat": -34.5123, "lon": -58.4567 }
