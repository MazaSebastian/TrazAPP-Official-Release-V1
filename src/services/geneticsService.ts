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

    async getActiveBatchesForGenetic(geneticId: string): Promise<any[]> {
        const { data, error } = await getClient()
            .from('batches')
            .select('quantity, stage, current_room_id, room:rooms(id, name, spot_id, spot:chakra_crops(id, name))')
            .eq('genetic_id', geneticId)
            // exclude 'completed' and 'discarded'
            .neq('stage', 'completed')
            .neq('stage', 'discarded');

        if (error) {
            console.error('Error fetching active batches for genetic:', error);
            return []; // Return empty array on error
        }
        return data || [];
    },

    async discardOrphanedBatches(geneticId: string): Promise<boolean> {
        const { error } = await getClient()
            .from('batches')
            .update({ stage: 'completed' })
            .eq('genetic_id', geneticId)
            .is('current_room_id', null)
            .neq('stage', 'completed');

        if (error) {
            console.error('Error discarding orphaned batches:', error);
            return false;
        }
        return true;
    },

    async uploadPhoto(file: File, geneticId: string): Promise<string | null> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${geneticId}-${Date.now()}.${fileExt}`;
        const filePath = `${getSelectedOrgId()}/${fileName}`;

        const { error: uploadError } = await getClient()
            .storage
            .from('genetic_photos')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading photo:', uploadError);
            return null;
        }

        const { data } = getClient()
            .storage
            .from('genetic_photos')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
};
