import { getSupabaseClient, resolveTenantContext, scopeQueryToOrg } from '../client/supabase.js';

export const RESOURCES_DEFINITIONS = [
  {
    uri: 'trazapp://org/daily-overview',
    name: 'Resumen Diario de Cultivo',
    description: 'Resumen consolidado del día: salas activas, alertas climáticas, tareas pendientes y stock crítico.',
    mimeType: 'application/json',
  },
];

export async function handleReadResource(uri: string) {
  const supabase = getSupabaseClient();
  const tenant = await resolveTenantContext();

  if (uri === 'trazapp://org/daily-overview') {
    // 1. Fetch count of active rooms
    let roomsQuery = supabase.from('rooms').select('id, name, current_plants');
    roomsQuery = await scopeQueryToOrg(roomsQuery);
    const { data: rooms } = await roomsQuery;

    // 2. Fetch pending tasks
    let tasksQuery = supabase
      .from('chakra_tasks')
      .select('id, title, due_date, type')
      .neq('status', 'done')
      .neq('status', 'dismissed')
      .limit(10);
    tasksQuery = await scopeQueryToOrg(tasksQuery);
    const { data: tasks } = await tasksQuery;

    // 3. Fetch active batches
    let batchesQuery = supabase
      .from('batches')
      .select('id, name, stage, plant_count')
      .neq('stage', 'harvested');
    batchesQuery = await scopeQueryToOrg(batchesQuery);
    const { data: batches } = await batchesQuery;

    const overview = {
      timestamp: new Date().toISOString(),
      club_name: tenant.organizationName,
      organization_id: tenant.organizationId,
      rooms_count: rooms?.length || 0,
      total_plants: (rooms || []).reduce((acc: number, r: any) => acc + (r.current_plants || 0), 0),
      active_batches_count: batches?.length || 0,
      pending_tasks_count: tasks?.length || 0,
      urgent_tasks: tasks || [],
    };

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(overview, null, 2),
        },
      ],
    };
  }

  throw new Error(`Recurso no encontrado: ${uri}`);
}
