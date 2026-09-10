// supabase/functions/trazapp-telemetry/index.ts
// Endpoint for ESP32 hardware devices to POST sensor telemetry.
// Does NOT require user JWT — authenticates via device_token.
// Returns enriched metadata (bunker, plants, tasks) for the hardware display.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-secret',
};

Deno.serve(async (req) => {
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
      .select('id, device_id, device_token, organization_id, is_active, room_id, bunker_name, device_type')
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
      return new Response(JSON.stringify({ error: 'Unauthorized — invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── 4. Insert telemetry log ─────────────────────────────────────
    const logEntry = {
      device_id,
      organization_id: device.organization_id,
      temp_c:         sensors?.temp_c  ?? null,
      hum_pct:        sensors?.hum_pct ?? null,
      soil_pct:       sensors?.soil_pct ?? null,
      vpd_kpa:        sensors?.vpd_kpa ?? null,
      vpd_stage:      vpd?.stage ?? null,
      vpd_stage_name: vpd?.stage_name ?? null,
      vpd_in_range:   vpd?.in_range ?? null,
      vpd_low:        vpd?.vpd_low ?? null,
      vpd_min:        vpd?.vpd_min ?? null,
      vpd_max:        vpd?.vpd_max ?? null,
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

    // ─── 6. Fetch enriched metadata for the device display ───────────
    let enrichedMeta: any = {
      bunker_name: device.bunker_name || null,
      room_name: null,
      room_type: null,
      plant_count: 0,
      genetics: [],
      plant_stage: null,
      tasks: [],
      plant_tags: [],
    };

    try {
      if (device.room_id) {
        // Room info
        const { data: room } = await supabase
          .from('rooms')
          .select('id, name, type')
          .eq('id', device.room_id)
          .maybeSingle();

        if (room) {
          enrichedMeta.room_name = room.name;
          enrichedMeta.room_type = room.type;
        }

        // Active batches (lotes/mesas) in this room
        const { data: batches } = await supabase
          .from('batches')
          .select('id, name, quantity, stage, genetic:genetics(name)')
          .eq('current_room_id', device.room_id)
          .is('discarded_at', null);

        if (batches && batches.length > 0) {
          let totalPlants = 0;
          const geneticNames: string[] = [];

          for (const batch of batches) {
            totalPlants += batch.quantity || (batch as any).total_plants || 0;
            const gName = (batch as any).genetic?.name;
            if (gName && !geneticNames.includes(gName)) {
              geneticNames.push(gName);
            }
            if (batch.stage) {
              enrichedMeta.plant_stage = batch.stage;
            }
          }

          enrichedMeta.plant_count = totalPlants;
          enrichedMeta.genetics = geneticNames;
        }

        // Clone maps for individual plant tags
        const { data: cloneMaps } = await supabase
          .from('clone_maps')
          .select('grid_data')
          .eq('room_id', device.room_id);

        if (cloneMaps && cloneMaps.length > 0) {
          const tags: string[] = [];
          for (const cm of cloneMaps) {
            if (cm.grid_data && Array.isArray(cm.grid_data)) {
              for (const row of cm.grid_data) {
                if (Array.isArray(row)) {
                  for (const cell of row) {
                    if (cell && cell.tag) {
                      tags.push(cell.tag);
                    }
                  }
                }
              }
            }
          }
          enrichedMeta.plant_tags = tags;
        }

        // Pending tasks for this room
        const { data: tasks } = await supabase
          .from('chakra_tasks')
          .select('id, title, due_date, status')
          .eq('room_id', device.room_id)
          .in('status', ['pending', 'in_progress'])
          .order('due_date', { ascending: true })
          .limit(5);

        if (tasks) {
          enrichedMeta.tasks = tasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            priority: 'normal',
            due_date: t.due_date,
            status: t.status,
          }));
        }
      }
    } catch (metaErr) {
      console.error('Error fetching enriched metadata (non-blocking):', metaErr);
    }

    // ─── 7. Return OK + enriched metadata to hardware ────────────────
    return new Response(JSON.stringify({
      success: true,
      message: 'Telemetry received',
      device: {
        bunker_name: enrichedMeta.bunker_name,
        room_name: enrichedMeta.room_name,
        room_type: enrichedMeta.room_type,
        plant_count: enrichedMeta.plant_count,
        plant_stage: enrichedMeta.plant_stage,
        genetics: enrichedMeta.genetics,
        tasks: enrichedMeta.tasks,
        plant_tags: enrichedMeta.plant_tags,
      },
    }), {
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
