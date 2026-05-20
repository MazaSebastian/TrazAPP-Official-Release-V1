// supabase/functions/trazapp-telemetry/index.ts
// Endpoint for ESP32 hardware devices to POST sensor telemetry.
// Does NOT require user JWT — authenticates via device_token.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-secret',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // ─── 1. Parse payload ───────────────────────────────────────────
    let payload: any;
    try {
      payload = await req.json();
    } catch (_) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { device_id, token, firmware, uptime_s, sensors, vpd, meta } = payload;

    if (!device_id || !token) {
      return new Response(JSON.stringify({ error: 'device_id and token are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Also accept token from X-Device-Secret header (both supported)
    const headerToken = req.headers.get('X-Device-Secret');
    const effectiveToken = headerToken || token;

    // ─── 2. Admin Supabase client (service_role — bypasses RLS) ────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // ─── 3. Authenticate device ──────────────────────────────────────
    const { data: device, error: deviceError } = await supabase
      .from('trazapp_devices')
      .select('id, device_id, device_token, organization_id, is_active')
      .eq('device_id', device_id)
      .maybeSingle();

    if (deviceError) {
      console.error('DB error looking up device:', deviceError);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!device) {
      console.warn(`Unknown device attempted telemetry: ${device_id}`);
      return new Response(JSON.stringify({ error: 'Device not registered' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!device.is_active) {
      return new Response(JSON.stringify({ error: 'Device is inactive' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (device.device_token !== effectiveToken) {
      console.warn(`Token mismatch for device: ${device_id}`);
      return new Response(JSON.stringify({ error: 'Unauthorized — invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── 4. Insert telemetry log ─────────────────────────────────────
    const logEntry = {
      device_id,
      organization_id: device.organization_id,
      // Sensors
      temp_c:         sensors?.temp_c  ?? null,
      hum_pct:        sensors?.hum_pct ?? null,
      soil_pct:       sensors?.soil_pct ?? null,
      vpd_kpa:        sensors?.vpd_kpa ?? null,
      // VPD stage
      vpd_stage:      vpd?.stage ?? null,
      vpd_stage_name: vpd?.stage_name ?? null,
      vpd_in_range:   vpd?.in_range ?? null,
      vpd_low:        vpd?.vpd_low ?? null,
      vpd_min:        vpd?.vpd_min ?? null,
      vpd_max:        vpd?.vpd_max ?? null,
      // Device metadata
      firmware,
      uptime_s:       uptime_s ?? null,
      rssi_dbm:       meta?.rssi_dbm ?? null,
      temp_real:      meta?.temp_real ?? true,
      hum_real:       meta?.hum_real ?? true,
      soil_real:      meta?.soil_real ?? true,
    };

    const { error: logError } = await supabase
      .from('trazapp_telemetry_logs')
      .insert(logEntry);

    if (logError) {
      console.error('Failed to insert telemetry log:', logError);
      // Don't block the device — try to update last_reading anyway
    }

    // ─── 5. Update device snapshot ───────────────────────────────────
    const { error: updateError } = await supabase
      .from('trazapp_devices')
      .update({
        last_seen_at: new Date().toISOString(),
        last_reading: payload,
        firmware:     firmware ?? undefined,
      })
      .eq('device_id', device_id);

    if (updateError) {
      console.error('Failed to update device last_reading:', updateError);
    }

    // ─── 6. Return OK to hardware ────────────────────────────────────
    return new Response(JSON.stringify({ success: true, message: 'Telemetry received' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Unhandled error in trazapp-telemetry:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
