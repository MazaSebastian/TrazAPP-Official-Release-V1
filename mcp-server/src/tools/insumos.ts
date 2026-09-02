import { z } from 'zod';
import { getSupabaseClient, resolveTenantContext } from '../client/supabase.js';

export const listInsumosSchema = z.object({
  lowStockOnly: z.boolean().default(false).describe('Filtrar únicamente insumos por debajo del stock mínimo'),
  categoria: z.string().optional().describe('Filtrar por categoría (fertilizantes, sustratos, preventivos, etc.)'),
  organizationId: z.string().optional().describe('ID de la organización'),
});

export async function handleListInsumos(args: z.infer<typeof listInsumosSchema>) {
  const supabase = getSupabaseClient();
  const tenant = await resolveTenantContext(args.organizationId);

  let query = supabase
    .from('chakra_stock_items')
    .select('id, nombre, categoria, stock_actual, unidad_medida, stock_minimo, precio_actual, proveedor, activo, created_at, organization_id')
    .eq('organization_id', tenant.organizationId)
    .eq('activo', true);

  if (args.categoria) {
    query = query.eq('categoria', args.categoria);
  }

  query = query.order('nombre');

  const { data, error } = await query;
  if (error) {
    throw new Error(`Error al consultar insumos de TrazAPP: ${error.message}`);
  }

  let items = data || [];
  if (args.lowStockOnly) {
    items = items.filter((i) => i.stock_minimo && i.stock_actual <= i.stock_minimo);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            count: items.length,
            insumos: items,
          },
          null,
          2
        ),
      },
    ],
  };
}
