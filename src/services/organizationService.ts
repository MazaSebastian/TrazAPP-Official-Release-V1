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
    },

    /**
     * Get all members of an organization with their profiles
     */
    async getOrganizationMembers(orgId: string): Promise<any[]> {
        console.log(`[DEBUG] getOrganizationMembers called for orgId: ${orgId}`);
        const { data, error } = await supabase
            .from('organization_members')
            .select(`
                id,
                role,
                created_at,
                user_id,
                profiles (
                    id,
                    email,
                    full_name,
                    avatar_url
                )
            `)
            .eq('organization_id', orgId);

        if (error) {
            console.error('Error fetching organization members:', error);
            throw error;
        }

        // Map 'profiles' to 'profile' for backward compatibility
        return data?.map((m: any) => ({
            ...m,
            profile: m.profiles
        })) || [];
    },

    /**
     * Update a member's role
     */
    async updateMemberRole(orgId: string, userId: string, newRole: string): Promise<boolean> {
        const { error } = await supabase
            .from('organization_members')
            .update({ role: newRole })
            .eq('organization_id', orgId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error updating member role:', error);
            throw error;
        }

        return true;
    },

    /**
     * Remove a member from the organization
     */
    async removeMember(orgId: string, userId: string): Promise<boolean> {
        const { error } = await supabase
            .from('organization_members')
            .delete()
            .eq('organization_id', orgId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error removing member:', error);
            throw error;
        }

        return true;
    },

    /**
     * Call the create-user Edge Function to create a user directly
     */
    async createUserDirectly(orgId: string, email: string, name: string, role: string, password: string): Promise<any> {
        // First check limits
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('plan')
            .eq('id', orgId)
            .single();

        if (orgError || !org) throw new Error('Organización no encontrada');

        const plan = await planService.getPlanBySlug(org.plan);
        if (!plan) throw new Error('Plan no encontrado');

        const maxUsers = plan.limits.max_users;

        const { count: membersCount, error: countError } = await supabase
            .from('organization_members')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId);

        if (countError) throw countError;

        if ((membersCount || 0) >= maxUsers) {
            throw new Error(`Has alcanzado el límite de ${maxUsers} usuarios activos permitidos para tu plan. Actualiza tu plan para agregar más.`);
        }

        // Call the edge function
        const { data, error } = await supabase.functions.invoke('create-user', {
            body: {
                email,
                password,
                name,
                role,
                organizationId: orgId
            }
        });

        if (error) {
            console.error("Error from edge function:", error);
            let rawError = error.message;
            if (error.context && typeof error.context.text === 'function') {
                try {
                    const ctxText = await error.context.text();
                    rawError = `RAW_ERROR: ${ctxText}`;
                    console.error("Edge function context:", ctxText);
                } catch (e) { }
            }
            else if (error.context && typeof error.context === 'string') {
                rawError = `RAW_ERROR: ${error.context}`;
            }
            throw new Error(rawError || 'Error al crear el usuario en el servidor');
        }

        if (data?.error) {
            throw new Error(data.error);
        }

        return data;
    }
};
