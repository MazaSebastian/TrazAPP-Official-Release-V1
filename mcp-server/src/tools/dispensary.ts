import { z } from 'zod';
import { getSupabaseClient, resolveTenantContext, scopeQueryToOrg } from '../client/supabase.js';

export const listDispensaryStockSchema = z.object({
  status: z.enum(['available', 'curing', 'quarantine', 'all']).default('available').describe('Estado de los lotes de dispensario'),
  productType: z.string().optional().describe('Filtrar por tipo: flower, extract, oil, cream, edible'),
  organizationId: z.string().optional().describe('ID de la organización'),
});

export const recordDispensaryMovementSchema = z.object({
  batchId: z.string().describe('ID del lote de dispensario (chakra_dispensary_batches)'),
  type: z.enum(['dispense', 'restock', 'adjustment', 'quality_test', 'disposal']).describe('Tipo de movimiento'),
  amount: z.number().positive().describe('Cantidad dispensada o ajustada (en gramos o ml)'),
  memberId: z.string().optional().describe('ID del paciente/socio que retira la medicina'),
  reason: z.string().optional().describe('Motivo u observación del movimiento'),
  organizationId: z.string().optional().describe('ID de la organización'),
});

export async function handleListDispensaryStock(args: z.infer<typeof listDispensaryStockSchema>) {
  const supabase = getSupabaseClient();
  const tenant = await resolveTenantContext(args.organizationId);

  let query = supabase
    .from('chakra_dispensary_batches')
    .select('id, product_name, strain_name, batch_code, product_type, quality_grade, current_weight, unit, status, price_per_gram, location, created_at')
    .eq('organization_id', tenant.organizationId)
    .neq('status', 'depleted');

  if (args.status !== 'all') {
    query = query.eq('status', args.status);
  }
  if (args.productType) {
    query = query.eq('product_type', args.productType);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    throw new Error(`Error al consultar stock de dispensario: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            count: data?.length || 0,
            stock: data || [],
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleRecordDispensaryMovement(args: z.infer<typeof recordDispensaryMovementSchema>) {
  const supabase = getSupabaseClient();
  const tenant = await resolveTenantContext(args.organizationId);

  // 1. Fetch current batch weight
  const { data: batch, error: batchErr } = await supabase
    .from('chakra_dispensary_batches')
    .select('*')
    .eq('id', args.batchId)
    .single();

  if (batchErr || !batch) {
    throw new Error(`Lote de dispensario no encontrado: ${batchErr?.message || ''}`);
  }

  const prevWeight = Number(batch.current_weight) || 0;
  let newWeight = prevWeight;

  if (args.type === 'dispense' || args.type === 'quality_test' || args.type === 'disposal') {
    if (prevWeight < args.amount) {
      throw new Error(`Stock insuficiente en lote ${batch.batch_code}. Stock actual: ${prevWeight}g, Solicitado: ${args.amount}g`);
    }
    newWeight = Math.max(0, prevWeight - args.amount);
  } else if (args.type === 'restock') {
    newWeight = prevWeight + args.amount;
  }

  // 2. Insert movement
  const movementPayload: any = {
    batch_id: args.batchId,
    type: args.type,
    amount: args.amount,
    previous_weight: prevWeight,
    new_weight: newWeight,
    member_id: args.memberId || null,
    reason: args.reason || 'Movimiento registrado vía TrazAPP MCP Agent',
    performed_by: tenant.userId || 'AI Agent (MCP)',
    organization_id: tenant.organizationId,
  };

  const { data: movement, error: movErr } = await supabase
    .from('chakra_dispensary_movements')
    .insert(movementPayload)
    .select()
    .single();

  if (movErr) {
    throw new Error(`Error al registrar movimiento: ${movErr.message}`);
  }

  // 3. Update batch status and current_weight
  const newStatus = newWeight <= 0 ? 'depleted' : batch.status;
  await supabase
    .from('chakra_dispensary_batches')
    .update({ current_weight: newWeight, status: newStatus })
    .eq('id', args.batchId);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            message: `Movimiento de dispensario (${args.type}) registrado correctamente`,
            movement,
            batch_summary: {
              batch_code: batch.batch_code,
              previous_weight: prevWeight,
              new_weight: newWeight,
              status: newStatus,
            },
          },
          null,
          2
        ),
      },
    ],
  };
}
