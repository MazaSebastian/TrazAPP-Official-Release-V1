import { z } from 'zod';
import { getSupabaseClient, resolveTenantContext, scopeQueryToOrg } from '../client/supabase.js';

export const listTasksSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'done', 'dismissed', 'all']).default('pending').describe('Estado de las tareas a consultar'),
  roomId: z.string().optional().describe('Filtrar por ID de sala'),
  cropId: z.string().optional().describe('Filtrar por ID de ciclo de cultivo'),
  organizationId: z.string().optional().describe('ID de la organización'),
});

export const createTaskSchema = z.object({
  title: z.string().describe('Título de la tarea (ej. Riego con solución vegetativa A+B)'),
  description: z.string().optional().describe('Detalle de instrucciones agronómicas'),
  type: z.string().default('irrigation').describe('Tipo de tarea: irrigation, fertilization, pest_control, pruning, harvest, maintenance, general'),
  dueDate: z.string().describe('Fecha límite o programada (ISO 8601, ej. 2026-08-16T10:00:00Z)'),
  roomId: z.string().optional().describe('ID de la sala asignada'),
  cropId: z.string().optional().describe('ID del cultivo'),
  assignedTo: z.string().optional().describe('Nombre o ID del técnico asignado'),
  organizationId: z.string().optional().describe('ID de la organización'),
});

export const completeTaskSchema = z.object({
  taskId: z.string().describe('ID de la tarea a marcar como completada'),
  observations: z.string().optional().describe('Observaciones o notas del trabajo realizado'),
});

export async function handleListTasks(args: z.infer<typeof listTasksSchema>) {
  const supabase = getSupabaseClient();
  const tenant = await resolveTenantContext(args.organizationId);

  let query = supabase
    .from('chakra_tasks')
    .select('id, title, description, type, due_date, status, room_id, crop_id, assigned_to, observations, created_at')
    .eq('organization_id', tenant.organizationId);

  if (args.status !== 'all') {
    if (args.status === 'pending') {
      query = query.neq('status', 'done').neq('status', 'dismissed');
    } else {
      query = query.eq('status', args.status);
    }
  }

  if (args.roomId) {
    query = query.eq('room_id', args.roomId);
  }
  if (args.cropId) {
    query = query.eq('crop_id', args.cropId);
  }

  query = query.order('due_date', { ascending: true, nullsFirst: false });

  const { data, error } = await query;
  if (error) {
    throw new Error(`Error al listar tareas de TrazAPP: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            count: data?.length || 0,
            tasks: data || [],
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleCreateTask(args: z.infer<typeof createTaskSchema>) {
  const supabase = getSupabaseClient();
  const tenant = await resolveTenantContext(args.organizationId);

  const payload: any = {
    title: args.title,
    description: args.description || null,
    type: args.type,
    due_date: args.dueDate,
    status: 'pending',
    room_id: args.roomId || null,
    crop_id: args.cropId || null,
    assigned_to: args.assignedTo || null,
    organization_id: tenant.organizationId,
  };

  const { data, error } = await supabase
    .from('chakra_tasks')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Error al agendar tarea en TrazAPP: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            message: 'Tarea agendada con éxito en TrazAPP',
            task: data,
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleCompleteTask(args: z.infer<typeof completeTaskSchema>) {
  const supabase = getSupabaseClient();
  const updateData: any = {
    status: 'done',
    completed_at: new Date().toISOString(),
  };

  if (args.observations) {
    updateData.observations = args.observations;
  }

  const { data, error } = await supabase
    .from('chakra_tasks')
    .update(updateData)
    .eq('id', args.taskId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error al completar tarea: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            message: `Tarea "${data.title}" marcada como completada`,
            task: data,
          },
          null,
          2
        ),
      },
    ],
  };
}
