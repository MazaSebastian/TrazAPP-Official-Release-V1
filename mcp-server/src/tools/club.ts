import { z } from 'zod';
import { getSupabaseClient, resolveTenantContext, authenticateWithApiKey, scopeQueryToOrg } from '../client/supabase.js';

export const authenticateSchema = z.object({
  apiKey: z.string().describe('API Key generada desde el panel web de TrazAPP (tz_live_...)'),
});

export const getClubOverviewSchema = z.object({
  organizationId: z.string().optional().describe('ID de la organización (opcional, inferido por la API Key)'),
});

export const getFinancialSummarySchema = z.object({
  year: z.number().int().optional().default(new Date().getFullYear()).describe('Año a consultar (ej. 2026)'),
  organizationId: z.string().optional().describe('ID de la organización'),
});

export async function handleAuthenticate(args: z.infer<typeof authenticateSchema>) {
  const tenant = await authenticateWithApiKey(args.apiKey);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            status: 'success',
            message: `¡Autenticación exitosa! Agente vinculado correctamente a "${tenant.organizationName}".`,
            club_name: tenant.organizationName,
            organization_id: tenant.organizationId,
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleGetClubOverview(args: z.infer<typeof getClubOverviewSchema>) {
  const supabase = getSupabaseClient();
  const tenant = await resolveTenantContext(args.organizationId);

  // 1. Get Organization basic info
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, plan, subscription_status, created_at')
    .eq('id', tenant.organizationId)
    .single();

  // 2. Count active rooms and total plants
  let roomsQuery = supabase.from('rooms').select('id, name, current_plants, capacity');
  roomsQuery = await scopeQueryToOrg(roomsQuery, tenant.organizationId);
  const { data: rooms } = await roomsQuery;

  // 3. Count active batches
  let batchesQuery = supabase
    .from('batches')
    .select('id, name, stage, plant_count')
    .neq('stage', 'harvested');
  batchesQuery = await scopeQueryToOrg(batchesQuery, tenant.organizationId);
  const { data: batches } = await batchesQuery;

  // 4. Count members / patients
  let membersQuery = supabase
    .from('organization_members')
    .select('id, role');
  membersQuery = await scopeQueryToOrg(membersQuery, tenant.organizationId);
  const { data: members } = await membersQuery;

  // 5. Count pending tasks
  let tasksQuery = supabase
    .from('chakra_tasks')
    .select('id, title, due_date')
    .neq('status', 'done')
    .neq('status', 'dismissed');
  tasksQuery = await scopeQueryToOrg(tasksQuery, tenant.organizationId);
  const { data: tasks } = await tasksQuery;

  const totalPlants = (rooms || []).reduce((sum, r) => sum + (r.current_plants || 0), 0);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            club_name: org?.name || tenant.organizationName,
            organization_id: tenant.organizationId,
            plan: org?.plan || 'Standard',
            cultivation_summary: {
              active_rooms_count: rooms?.length || 0,
              total_plants: totalPlants,
              active_batches_count: batches?.length || 0,
              rooms_breakdown: rooms || [],
            },
            operations_summary: {
              registered_members_count: members?.length || 0,
              pending_tasks_count: tasks?.length || 0,
            },
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleGetFinancialSummary(args: z.infer<typeof getFinancialSummarySchema>) {
  const supabase = getSupabaseClient();
  const tenant = await resolveTenantContext(args.organizationId);

  // 1. Try RPC get_monthly_metrics
  let monthlyMetrics = [];
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_monthly_metrics', {
      query_year: args.year,
      org_id: tenant.organizationId,
    });
    if (!rpcErr && rpcData) {
      monthlyMetrics = rpcData;
    }
  } catch (e) {
    // ignore
  }

  // 2. Fetch expenses from chakra_expenses
  let expensesQuery = supabase
    .from('chakra_expenses')
    .select('id, amount, category, date, description');
  expensesQuery = await scopeQueryToOrg(expensesQuery, tenant.organizationId);
  const { data: expenses } = await expensesQuery;

  const totalExpenses = (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // 3. Fetch dispensary revenue movements
  let dispQuery = supabase
    .from('chakra_dispensary_movements')
    .select('id, amount, transaction_value, type, created_at')
    .eq('type', 'dispense');
  dispQuery = await scopeQueryToOrg(dispQuery, tenant.organizationId);
  const { data: dispMovements } = await dispQuery;

  const totalDispensaryRevenue = (dispMovements || []).reduce(
    (sum, m) => sum + (Number(m.transaction_value) || 0),
    0
  );
  const totalGramsDispensados = (dispMovements || []).reduce(
    (sum, m) => sum + (Number(m.amount) || 0),
    0
  );

  const netBalance = totalDispensaryRevenue - totalExpenses;

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            club_name: tenant.organizationName,
            year: args.year,
            financial_summary: {
              total_dispensary_revenue: totalDispensaryRevenue,
              total_grams_dispensed: totalGramsDispensados,
              total_operational_expenses: totalExpenses,
              net_balance: netBalance,
              status: netBalance >= 0 ? 'Superávit' : 'Déficit',
            },
            monthly_breakdown: monthlyMetrics,
            recent_expenses_count: expenses?.length || 0,
          },
          null,
          2
        ),
      },
    ],
  };
}
