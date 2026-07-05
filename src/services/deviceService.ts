// src/services/deviceService.ts
// Abstraction layer for TrazAPP in-house IoT device operations.

import { supabase, getSelectedOrgId } from './supabaseClient';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const LINK_DEVICE_URL = isLocal ? 'https://software.trazapp.ar/api/link-device' : '/api/link-device';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TrazAppDevice {
  id: string;
  device_id: string;
  alias: string | null;
  firmware: string | null;
  organization_id: string | null;
  room_id: string | null;
  last_seen_at: string | null;
  last_reading: TelemetryPayload | null;
  is_active: boolean;
  is_provisioned: boolean;
  created_at: string;
}

export interface TelemetryPayload {
  device: string;
  device_id: string;
  token: string;
  firmware: string;
  uptime_s: number;
  sensors: {
    temp_c: number;
    hum_pct: number;
    soil_pct: number;
    vpd_kpa: number;
  };
  vpd: {
    stage: number;
    stage_name: string;
    in_range: boolean;
    vpd_low: boolean;
    vpd_min: number;
    vpd_max: number;
  };
  meta: {
    temp_real: boolean;
    hum_real: boolean;
    soil_real: boolean;
    rssi_dbm: number;
  };
}

export interface TelemetryLog {
  id: number;
  device_id: string;
  temp_c: number | null;
  hum_pct: number | null;
  soil_pct: number | null;
  vpd_kpa: number | null;
  vpd_stage: number | null;
  vpd_stage_name: string | null;
  vpd_in_range: boolean | null;
  rssi_dbm: number | null;
  recorded_at: string;
}

export interface LinkDevicePayload {
  device_id: string;
  pin: string;
  alias?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const deviceService = {
  /**
   * Fetch all devices linked to the current organization.
   */
  async getMyDevices(): Promise<TrazAppDevice[]> {
    const orgId = getSelectedOrgId();
    if (!orgId || !supabase) return [];

    const { data, error } = await supabase
      .from('trazapp_devices')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[deviceService] getMyDevices error:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Link a new device to the current user's organization using Device ID + PIN.
   */
  async linkDevice(payload: LinkDevicePayload): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not initialized.' };

    const orgId = getSelectedOrgId();
    if (!orgId) return { success: false, error: 'No hay organización seleccionada.' };

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, error: 'Sesión no válida.' };

    try {
      const response = await fetch(LINK_DEVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          device_id:      payload.device_id.trim(),
          pin:            payload.pin.trim(),
          organization_id: orgId,
          alias:          payload.alias?.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Error al vincular dispositivo.' };
      }

      return { success: true, message: result.message };
    } catch (err: any) {
      console.error('[deviceService] linkDevice error:', err);
      return { success: false, error: 'Error de red al vincular el dispositivo.' };
    }
  },

  /**
   * Unlink a device from the current organization (soft unlink — keeps record).
   */
  async unlinkDevice(deviceId: string): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
      .rpc('unlink_device', { p_device_id: deviceId });

    if (error) throw error;
  },

  /**
   * Update device alias and room assignment.
   */
  async updateDevice(deviceId: string, updates: { alias?: string | null; room_id?: string | null }): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
      .from('trazapp_devices')
      .update(updates)
      .eq('device_id', deviceId);

    if (error) throw error;
  },

  /**
   * Fetch telemetry history for a device over the last N hours.
   */
  async getTelemetryHistory(deviceId: string, hours: number = 24): Promise<TelemetryLog[]> {
    if (!supabase) return [];

    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('trazapp_telemetry_logs')
      .select('id, device_id, temp_c, hum_pct, soil_pct, vpd_kpa, vpd_stage, vpd_stage_name, vpd_in_range, rssi_dbm, recorded_at')
      .eq('device_id', deviceId)
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: true })
      .limit(2000);

    if (error) {
      console.error('[deviceService] getTelemetryHistory error:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Check if a device is online (last_seen_at within 3 minutes).
   */
  isOnline(device: TrazAppDevice): boolean {
    if (!device.last_seen_at) return false;
    const lastSeen = new Date(device.last_seen_at).getTime();
    const threeMinutesAgo = Date.now() - 3 * 60 * 1000;
    return lastSeen >= threeMinutesAgo;
  },

  /**
   * Get VPD status color for UI.
   */
  getVpdColor(inRange: boolean | null | undefined, vpd: number | null | undefined): string {
    if (inRange === null || inRange === undefined) return '#64748b';
    if (inRange) return '#10b981'; // green
    if (vpd !== null && vpd !== undefined && vpd < 0.4) return '#3b82f6'; // too low — blue
    return '#ef4444'; // too high — red
  },

  /**
   * Get temperature color for UI.
   */
  getTempColor(temp: number | null | undefined): string {
    if (temp === null || temp === undefined) return '#64748b';
    if (temp < 18) return '#3b82f6';
    if (temp > 30) return '#ef4444';
    return '#10b981';
  },
};

export default deviceService;
