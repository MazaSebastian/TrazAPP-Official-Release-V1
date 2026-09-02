import { z } from 'zod';
import { getSupabaseClient, resolveTenantContext, scopeQueryToOrg } from '../client/supabase.js';

export const listBatchesSchema = z.object({
  roomId: z.string().optional().describe('Filtrar lotes por ID de sala'),
  stage: z
    .enum([
      'germination',
      'cloning',
      'vegetative',
      'pre_flowering',
      'flowering',
      'drying',
      'curing',
      'stored',
      'harvested',
      'destroyed',
    ])
    .optional()
    .describe('Filtrar por etapa fenológica'),
  organizationId: z.string().optional().describe('ID de la organización'),
});

export const createBatchSchema = z.object({
  name: z.string().describe('Nombre descriptivo del lote (ej. Lote Mimosa EVO #3)'),
  trackingCode: z.string().optional().describe('Código de seguimiento alfanumérico'),
  geneticsId: z.string().optional().describe('ID de la genética'),
  roomId: z.string().optional().describe('ID de la sala donde se aloja el lote'),
  stage: z
    .enum(['germination', 'cloning', 'vegetative', 'pre_flowering', 'flowering'])
    .default('vegetative')
    .describe('Etapa inicial del lote'),
  plantCount: z.number().int().positive().describe('Cantidad de plantas o esquejes en el lote'),
  parentBatchId: z.string().optional().describe('ID del lote madre (para trazabilidad de esquejes)'),
  notes: z.string().optional().describe('Notas u observaciones del cultivo'),
  organizationId: z.string().optional().describe('ID de la organización'),
});

export const updateBatchStageSchema = z.object({
  batchId: z.string().describe('ID del lote a actualizar'),
  newStage: z
    .enum([
      'germination',
      'cloning',
      'vegetative',
      'pre_flowering',
      'flowering',
      'drying',
      'curing',
      'stored',
      'harvested',
      'destroyed',
    ])
    .describe('Nueva etapa fenológica'),
  newRoomId: z.string().optional().describe('ID de la nueva sala si hubo trasplante o reubicación'),
  notes: z.string().optional().describe('Motivo o notas del cambio de fase'),
});

export async function handleListBatches(args: z.infer<typeof listBatchesSchema>) {
  const supabase = getSupabaseClient();
  const tenant = await resolveTenantContext(args.organizationId);

  let query = supabase
    .from('batches')
    .select('id, name, tracking_code, stage, quantity, current_room_id, genetic_id, start_date, created_at, discarded_at')
    .eq('organization_id', tenant.organizationId)
    .is('discarded_at', null);

  if (args.roomId) {
    query = query.eq('current_room_id', args.roomId);
  }
  if (args.stage) {
    query = query.eq('stage', args.stage);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    throw new Error(`Error al listar lotes: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            count: data?.length || 0,
            batches: data || [],
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleCreateBatch(args: z.infer<typeof createBatchSchema>) {
  const supabase = getSupabaseClient();
  const tenant = await resolveTenantContext(args.organizationId);

  const payload: any = {
    name: args.name,
    tracking_code: args.trackingCode || `TZ-${Date.now().toString(36).toUpperCase()}`,
    stage: args.stage,
    quantity: args.plantCount,
    current_room_id: args.roomId || null,
    genetic_id: args.geneticsId || null,
    parent_id: args.parentBatchId || null,
    notes: args.notes || null,
    start_date: new Date().toISOString(),
    organization_id: tenant.organizationId,
  };

  const { data, error } = await supabase
    .from('batches')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Error al crear lote en TrazAPP: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            message: 'Lote creado con éxito en TrazAPP',
            batch: data,
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleUpdateBatchStage(args: z.infer<typeof updateBatchStageSchema>) {
  const supabase = getSupabaseClient();
  const updateData: any = {
    stage: args.newStage,
  };

  if (args.newRoomId) {
    updateData.room_id = args.newRoomId;
  }

  const { data, error } = await supabase
    .from('batches')
    .update(updateData)
    .eq('id', args.batchId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error al actualizar estado del lote: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            message: `Lote ${data.name} actualizado a fase ${args.newStage}`,
            batch: data,
          },
          null,
          2
        ),
      },
    ],
  };
}
