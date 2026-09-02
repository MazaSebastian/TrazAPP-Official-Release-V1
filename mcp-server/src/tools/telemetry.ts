import { z } from 'zod';
import { getSupabaseClient, resolveTenantContext } from '../client/supabase.js';

export const getRoomTelemetrySchema = z.object({
  roomId: z.string().describe('ID de la sala a inspeccionar'),
  organizationId: z.string().optional().describe('ID de la organización'),
});

export const listDevicesSchema = z.object({
  organizationId: z.string().optional().describe('ID de la organización'),
});

export async function handleGetRoomTelemetry(args: z.infer<typeof getRoomTelemetrySchema>) {
  const supabase = getSupabaseClient();

  // 1. Get room details for ideal thresholds
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, name, ideal_temp_min, ideal_temp_max, ideal_humidity_min, ideal_humidity_max')
    .eq('id', args.roomId)
    .single();

  if (roomError || !room) {
    throw new Error(`Sala no encontrada: ${roomError?.message || ''}`);
  }

  // 2. Get device linked to this room
  let deviceQuery = supabase
    .from('trazapp_devices')
    .select('id, device_id, alias, is_active, last_seen_at, last_reading')
    .eq('room_id', args.roomId)
    .eq('is_active', true);

  const { data: devices } = await deviceQuery;

  // 3. Evaluate environmental compliance
  const primaryDevice = devices && devices.length > 0 ? devices[0] : null;
  const lastReading = primaryDevice?.last_reading as any;

  let climateAssessment = {
    tempStatus: 'unknown',
    humidityStatus: 'unknown',
    alerts: [] as string[],
  };

  if (lastReading?.sensors) {
    const temp = lastReading.sensors.temp_c;
    const hum = lastReading.sensors.hum_pct;
    const vpd = lastReading.sensors.vpd_kpa;

    if (room.ideal_temp_max && temp > room.ideal_temp_max) {
      climateAssessment.tempStatus = 'high';
      climateAssessment.alerts.push(`Temperatura ALTA: ${temp}°C (Máx: ${room.ideal_temp_max}°C)`);
    } else if (room.ideal_temp_min && temp < room.ideal_temp_min) {
      climateAssessment.tempStatus = 'low';
      climateAssessment.alerts.push(`Temperatura BAJA: ${temp}°C (Mín: ${room.ideal_temp_min}°C)`);
    } else {
      climateAssessment.tempStatus = 'optimal';
    }

    if (room.ideal_humidity_max && hum > room.ideal_humidity_max) {
      climateAssessment.humidityStatus = 'high';
      climateAssessment.alerts.push(`Humedad ALTA: ${hum}% (Máx: ${room.ideal_humidity_max}%)`);
    } else if (room.ideal_humidity_min && hum < room.ideal_humidity_min) {
      climateAssessment.humidityStatus = 'low';
      climateAssessment.alerts.push(`Humedad BAJA: ${hum}% (Mín: ${room.ideal_humidity_min}%)`);
    } else {
      climateAssessment.humidityStatus = 'optimal';
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            room_name: room.name,
            thresholds: {
              temp_range: `${room.ideal_temp_min || 18}°C - ${room.ideal_temp_max || 26}°C`,
              humidity_range: `${room.ideal_humidity_min || 45}% - ${room.ideal_humidity_max || 65}%`,
            },
            devices_found: devices?.length || 0,
            primary_device: primaryDevice,
            assessment: climateAssessment,
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleListDevices(args: z.infer<typeof listDevicesSchema>) {
  const supabase = getSupabaseClient();
  const tenant = await resolveTenantContext(args.organizationId);

  let query = supabase
    .from('trazapp_devices')
    .select('id, device_id, alias, firmware, room_id, is_active, last_seen_at, last_reading')
    .eq('organization_id', tenant.organizationId)
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    throw new Error(`Error al consultar dispositivos IoT: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            count: data?.length || 0,
            devices: data || [],
          },
          null,
          2
        ),
      },
    ],
  };
}
