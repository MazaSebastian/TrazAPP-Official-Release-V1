import { supabase } from './supabaseClient';
import { Organization } from '../types';
import { planService } from './planService';

export const organizationService = {
    /**
     * Create a new organization and assign a default plan (e.g., 'free').
     */
    async createOrganization(name: string, ownerEmail: string, planSlug: string = 'free'): Promise<Organization | null> {
        // 1. Verify plan exists
        const plan = await planService.getPlanBySlug(planSlug);
        if (!plan) {
            throw new Error(`Plan '${planSlug}' not found.`);
        }

        // 2. Create Organization
        const { data, error } = await supabase
            .from('organizations')
            .insert([{
                name,
                owner_email: ownerEmail,
                plan: planSlug,
                slug: name.toLowerCase().replace(/\s+/g, '-'), // Simple slug generation
                status: 'active',
                subscription_status: 'trial', // Start with trial or active
                // Use plan limits to set initial values if schema requires it, 
                // otherwise we rely on joining with the plan table or fetching plan details.
                // For redundant fields if they still exist:
                max_users: plan.limits.max_users,
                max_storage_gb: plan.limits.max_storage_gb
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating organization:', error);
            throw error;
        }

        return data as Organization;
    },

    /**
     * Update an organization's plan.
     */
    async updateOrganizationPlan(orgId: string, newPlanSlug: string): Promise<Organization> {
        // 1. Verify new plan
        const plan = await planService.getPlanBySlug(newPlanSlug);
        if (!plan) {
            throw new Error(`Plan '${newPlanSlug}' not found.`);
        }

        // 2. Update Organization
        const { data, error } = await supabase
            .from('organizations')
            .update({
                plan: newPlanSlug,
                // Update redundant limits if necessary
                max_users: plan.limits.max_users,
                max_storage_gb: plan.limits.max_storage_gb
            })
            .eq('id', orgId)
            .select()
            .single();

        if (error) {
            console.error('Error updating organization plan:', error);
            throw error;
        }

        return data as Organization;
    },

    /**
     * Get organization details including plan info/limits.
     * This logic might be better placed in a hook or context that merges org data with plan data.
     */
    async getOrganizationDetails(orgId: string): Promise<Organization & { planDetails?: any }> {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .single();

        if (error) {
            throw error;
        }

        const org = data as Organization;
        // Fetch plan details to return full context
        const plan = await planService.getPlanBySlug(org.plan);

        return {
            ...org,
            planDetails: plan
        };
    }
};
