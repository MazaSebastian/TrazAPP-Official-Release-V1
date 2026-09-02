import { z } from 'zod';
import { getSupabaseClient, resolveTenantContext, scopeQueryToOrg } from '../client/supabase.js';

export const listCropsSchema = z.object({
  status: z.enum(['active', 'completed', 'archived']).optional().describe('Filtrar por estado del ciclo'),
  organizationId: z.string().optional().describe('ID de la organización'),
});

export const createCropSchema = z.object({
  name: z.string().describe('Nombre del ciclo de cultivo (ej. Ciclo Verano 2026 - Interior)'),
  season: z.string().optional().describe('Temporada o descripción del ciclo'),
  startDate: z.string().optional().describe('Fecha de inicio (ISO 8601)'),
  organizationId: z.string().optional().describe('ID de la organización'),
});

export async function handleListCrops(args: z.infer<typeof listCropsSchema>) {
  const supabase = getSupabaseClient();
  const tenant = await resolveTenantContext(args.organizationId);

  let query = supabase
    .from('chakra_crops')
    .select('id, name, season, start_date, end_date, status, created_at')
    .eq('organization_id', tenant.organizationId);

  if (args.status) {
    query = query.eq('status', args.status);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    throw new Error(`Error al listar cultivos: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            count: data?.length || 0,
            crops: data || [],
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleCreateCrop(args: z.infer<typeof createCropSchema>) {
  const supabase = getSupabaseClient();
  const tenant = await resolveTenantContext(args.organizationId);

  const payload: any = {
    name: args.name,
    season: args.season || null,
    start_date: args.startDate || new Date().toISOString(),
    status: 'active',
    organization_id: tenant.organizationId,
  };

  const { data, error } = await supabase
    .from('chakra_crops')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Error al crear ciclo de cultivo: ${error.message}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            message: 'Ciclo de cultivo registrado correctamente',
            crop: data,
          },
          null,
          2
        ),
      },
    ],
  };
}
