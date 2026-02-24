import { supabase, getSelectedOrgId } from './supabaseClient';
import { Genetic } from '../types/genetics';

const getClient = () => {
    if (!supabase) throw new Error("Supabase client not initialized");
    return supabase;
};

export const geneticsService = {
    async getGenetics(): Promise<Genetic[]> {
        const { data, error } = await getClient()
            .from('genetics')
            .select('*')
            .eq('organization_id', getSelectedOrgId())
            .order('name');

        if (error) {
            console.error('Error fetching genetics:', error);
            return [];
        }
        return data || [];
    },

    async createGenetic(genetic: Omit<Genetic, 'id' | 'created_at'>): Promise<Genetic | null> {
        const { data, error } = await getClient()
            .from('genetics')
            .insert([{ ...genetic, organization_id: getSelectedOrgId() }])
            .select()
            .single();

        if (error) {
            console.error('Error creating genetic:', error);
            return null;
        }
        return data;
    },

    async updateGenetic(id: string, updates: Partial<Genetic>): Promise<boolean> {
        const { error } = await getClient()
            .from('genetics')
            .update(updates)
            .eq('id', id)
            .eq('organization_id', getSelectedOrgId());

        if (error) {
            console.error('Error updating genetic:', error);
            return false;
        }
        return true;
    },

    async deleteGenetic(id: string): Promise<boolean> {
        const { error } = await getClient()
            .from('genetics')
            .delete()
            .eq('id', id)
            .eq('organization_id', getSelectedOrgId());

        if (error) {
            console.error('Error deleting genetic:', error);
            return false;
        }
        return true;
    },

    async getActiveBatchesCountForGenetic(geneticId: string): Promise<number> {
        const { data, error, count } = await getClient()
            .from('batches')
            .select('*', { count: 'exact', head: true })
            .eq('genetic_id', geneticId)
            // exclude 'completed' or strictly count any existing relation
            .neq('stage', 'completed');

        if (error) {
            console.error('Error counting active batches for genetic:', error);
            return 0; // Return 0 on error to not block UI unnecessarily, though ideally we'd throw or return a status
        }
        return count || 0;
    }
};
