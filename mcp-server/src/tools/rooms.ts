import { z } from 'zod';
import { getSupabaseClient, resolveTenantContext } from '../client/supabase.js';

export const listRoomsSchema = z.object({
  organizationId: z.string().optional().describe('ID de la organización (opcional si está en .env)'),
});

export const getRoomDetailsSchema = z.object({
  roomId: z.string().describe('ID de la sala a consultar'),
  organizationId: z.string().optional().describe('ID de la organización'),
});

export async function handleListRooms(args: z.infer<typeof listRoomsSchema>) {
  const supabase = getSupabaseClient();
  const tenant = await resolveTenantContext(args.organizationId);

  let query = supabase
    .from('rooms')
    .select('id, name, type, capacity, is_indoor, current_temperature, current_humidity, created_at, organization_id')
    .eq('organization_id', tenant.organizationId)
    .order('name');

  const { data, error } = await query;
  if (error) {
    throw new Error(`Error al consultar salas en TrazAPP: ${error.message}`);
  }

  // Get active plant batches to attach plant count
  const { data: batches } = await supabase
    .from('batches')
    .select('id, current_room_id, quantity, stage')
    .eq('organization_id', tenant.organizationId)
    .is('discarded_at', null);

  const roomsWithCounts = (data || []).map((r) => {
    const roomBatches = (batches || []).filter((b) => b.current_room_id === r.id);
    const plantCount = roomBatches.reduce((acc, b) => acc + (b.quantity || 1), 0);
    return {
      ...r,
      current_plants: plantCount,
      active_batches_count: roomBatches.length,
    };
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            count: roomsWithCounts.length,
            rooms: roomsWithCounts,
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleGetRoomDetails(args: z.infer<typeof getRoomDetailsSchema>) {
  const supabase = getSupabaseClient();
  
  // Room info
  let roomQuery = supabase
    .from('rooms')
    .select('*')
    .eq('id', args.roomId)
    .single();

  const { data: room, error: roomError } = await roomQuery;
  if (roomError) {
    throw new Error(`Error al consultar detalle de sala: ${roomError.message}`);
  }

  // Active batches in room
  let batchesQuery = supabase
    .from('batches')
    .select('id, name, tracking_code, stage, quantity, genetic_id')
    .eq('current_room_id', args.roomId)
    .is('discarded_at', null);

  const { data: batches } = await batchesQuery;

  // Pending tasks in room
  let tasksQuery = supabase
    .from('chakra_tasks')
    .select('id, title, due_date, status, type, description')
    .eq('room_id', args.roomId)
    .neq('status', 'done')
    .neq('status', 'dismissed');

  const { data: tasks } = await tasksQuery;

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            room,
            active_batches: batches || [],
            pending_tasks: tasks || [],
          },
          null,
          2
        ),
      },
    ],
  };
}
