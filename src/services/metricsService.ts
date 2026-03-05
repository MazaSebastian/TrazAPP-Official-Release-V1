import { supabase, getSelectedOrgId } from './supabaseClient';

export interface MonthlyMetric {
    month: number;
    total_yield: number;
    total_expenses: number;
    total_revenue: number;
}

export interface GeneticPerformance {
    genetic_name: string;
    total_yield_g: number;
    harvest_count: number;
    avg_yield_per_harvest: number;
}

export interface CostCategory {
    category: string;
    total_amount: number;
    percentage: number;
}

export interface Expense {
    id: string;
    date: string;
    amount: number;
    category: 'electricity' | 'water' | 'nutrients' | 'substrates' | 'rent' | 'salaries' | 'maintenance' | 'equipment' | 'other';
    description?: string;
    room_id?: string;
    logged_by?: string;
}

export const metricsService = {
    // RPC Calls
    async getMonthlyMetrics(year: number): Promise<MonthlyMetric[]> {
        if (!supabase) return [];
        const { data, error } = await supabase.rpc('get_monthly_metrics', { query_year: year });
        if (error) {
            console.error('Error fetching monthly metrics:', error);
            return [];
        }
        return data || [];
    },

    async getGeneticPerformance(): Promise<GeneticPerformance[]> {
        if (!supabase) return [];
        const { data, error } = await supabase.rpc('get_genetic_performance');
        if (error) {
            console.error('Error fetching genetic performance:', error);
            return [];
        }
        return data || [];
    },

    async getCostBreakdown(startDate: string, endDate: string): Promise<CostCategory[]> {
        if (!supabase) return [];
        const { data, error } = await supabase.rpc('get_cost_breakdown', { start_date: startDate, end_date: endDate });
        if (error) {
            console.error('Error fetching cost breakdown:', error);
            return [];
        }
        return data || [];
    },

    async getMortalityStats(): Promise<{ reason: string; count: number }[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('batches')
            .select('discard_reason, quantity')
            .not('discard_reason', 'is', null)
            .neq('discard_reason', 'Distribuido en Mapa (Bulk)')
            .eq('organization_id', getSelectedOrgId());

        if (error) {
            console.error('Error fetching mortality stats:', error);
            return [];
        }

        const stats: Record<string, number> = {};
        data?.forEach((b: any) => {
            const reasonBase = b.discard_reason.split(' - ')[0]; // Group by base reason enum
            stats[reasonBase] = (stats[reasonBase] || 0) + (b.quantity || 1);
        });
        return Object.entries(stats).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
    },

    async getGeneticSurvivalRate(): Promise<{ genetic_name: string; survival_rate: number; total: number; discarded: number }[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('batches')
            .select('discarded_at, discard_reason, quantity, genetics(name)')
            .eq('organization_id', getSelectedOrgId());

        if (error) {
            console.error('Error fetching survival rate:', error);
            return [];
        }

        const stats: Record<string, { total: number, discarded: number }> = {};
        data?.forEach((b: any) => {
            // Note: foreign keys are often array or single object depending on relation
            const geneticData = Array.isArray(b.genetics) ? b.genetics[0] : b.genetics;
            const name = geneticData?.name || 'Desconocida';
            if (!stats[name]) stats[name] = { total: 0, discarded: 0 };

            const qty = b.quantity || 1;
            stats[name].total += qty;
            if (b.discarded_at && b.discard_reason !== 'Distribuido en Mapa (Bulk)') {
                stats[name].discarded += qty;
            }
        });

        return Object.entries(stats).map(([genetic_name, stat]) => ({
            genetic_name,
            total: stat.total,
            discarded: stat.discarded,
            survival_rate: stat.total > 0 ? ((stat.total - stat.discarded) / stat.total) * 100 : 0
        })).sort((a, b) => b.survival_rate - a.survival_rate);
    },

    async getLabAverageYield(): Promise<number> {
        if (!supabase) return 0;
        const { data, error } = await supabase
            .from('chakra_extractions')
            .select('input_weight, output_weight')
            .eq('organization_id', getSelectedOrgId());

        if (error || !data || data.length === 0) return 0;

        let totalInput = 0;
        let totalOutput = 0;
        data.forEach((e: any) => {
            totalInput += (Number(e.input_weight) || 0);
            totalOutput += (Number(e.output_weight) || 0);
        });

        if (totalInput === 0) return 0;
        return (totalOutput / totalInput) * 100;
    },

    async getLabYieldByTechnique(): Promise<{ technique: string; yield_percentage: number; total_input: number; total_output: number }[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('chakra_extractions')
            .select('technique, input_weight, output_weight')
            .eq('organization_id', getSelectedOrgId());

        if (error || !data || data.length === 0) return [];

        const stats: Record<string, { input: number, output: number }> = {};
        data.forEach((e: any) => {
            const tech = e.technique || 'Desconocida';
            if (!stats[tech]) stats[tech] = { input: 0, output: 0 };
            stats[tech].input += (Number(e.input_weight) || 0);
            stats[tech].output += (Number(e.output_weight) || 0);
        });

        return Object.entries(stats).map(([technique, w]) => ({
            technique,
            total_input: w.input,
            total_output: w.output,
            yield_percentage: w.input > 0 ? (w.output / w.input) * 100 : 0
        })).sort((a, b) => b.yield_percentage - a.yield_percentage);
    },

    // Expenses CRUD
    async getExpenses(limit = 50): Promise<Expense[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('chakra_expenses')
            .select('*')
            .eq('organization_id', getSelectedOrgId())
            .order('date', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching expenses:', error);
            return [];
        }
        return data || [];
    },

    async createExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense | null> {
        if (!supabase) return null;
        const { data, error } = await supabase.from('chakra_expenses').insert([{ ...expense, organization_id: getSelectedOrgId() }]).select().single();
        if (error) {
            console.error('Error creating expense:', error);
            return null;
        }
        return data;
    },

    async deleteExpense(id: string): Promise<boolean> {
        if (!supabase) return false;
        const { error } = await supabase.from('chakra_expenses').delete().eq('id', id);
        if (error) return false;
        return true;
    }
};
