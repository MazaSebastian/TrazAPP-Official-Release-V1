import { supabase } from './supabaseClient';
import { Plan } from '../types';

export const planService = {
    /**
     * Fetch all active plans.
     */
    async getPlans(): Promise<Plan[]> {
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .eq('active', true)
            .order('price', { ascending: true });

        if (error) {
            console.error('Error fetching plans:', error);
            throw error;
        }
        return data as Plan[];
    },

    /**
     * Fetch a specific plan by its slug.
     */
    async getPlanBySlug(slug: string): Promise<Plan | null> {
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            console.error(`Error fetching plan ${slug}:`, error);
            return null;
        }
        return data as Plan;
    },

    /**
     * Create a new plan (Admin only).
     */
    async createPlan(plan: Omit<Plan, 'id' | 'created_at'>): Promise<Plan> {
        const { data, error } = await supabase
            .from('plans')
            .insert([plan])
            .select()
            .single();

        if (error) {
            console.error('Error creating plan:', error);
            throw error;
        }
        return data as Plan;
    },

    /**
     * Update an existing plan (Admin only).
     */
    async updatePlan(id: string, updates: Partial<Plan>): Promise<Plan> {
        const { data, error } = await supabase
            .from('plans')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating plan:', error);
            throw error;
        }
        return data as Plan;
    }
};
