import { supabase } from './supabaseClient';
import { planService } from './planService';

export interface Invite {
    id: string;
    organization_id: string;
    email: string;
    role: string;
    token: string;
    status: 'pending' | 'accepted' | 'expired';
    created_at: string;
    expires_at: string;
}

export const inviteService = {
    /**
     * Create an invitation for a user to join an organization.
     */
    async createInvite(orgId: string, email: string, role: string = 'grower'): Promise<Invite | null> {
        // 0. Check Organization Limits
        // Get organization plan
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('plan')
            .eq('id', orgId)
            .single();

        if (orgError || !org) {
            throw new Error('Organization not found');
        }

        const plan = await planService.getPlanBySlug(org.plan);
        if (!plan) {
            throw new Error('Plan not found for organization');
        }

        const maxUsers = plan.limits.max_users;

        // Count current members
        const { count: membersCount, error: countError } = await supabase
            .from('organization_members')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId);

        if (countError) throw countError;

        // Count pending invites
        const { count: pendingCount, error: pendingError } = await supabase
            .from('organization_invites')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('status', 'pending');

        if (pendingError) throw pendingError;

        const currentTotal = (membersCount || 0) + (pendingCount || 0);

        if (currentTotal >= maxUsers) {
            throw new Error(`Has alcanzado el límite de ${maxUsers} usuarios para tu plan actual. Actualiza tu plan para agregar más miembros.`);
        }

        // 1. Check if invite already exists for this email
        const { data: existing } = await supabase
            .from('organization_invites')
            .select('*')
            .eq('organization_id', orgId)
            .eq('email', email)
            .eq('status', 'pending')
            .single();

        if (existing) return existing as Invite;

        // 2. Create new invite
        const { data, error } = await supabase
            .from('organization_invites')
            .insert([{
                organization_id: orgId,
                email,
                role
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating invite:', error);
            throw error;
        }

        return data as Invite;
    },

    /**
     * Get invite details by token.
     */
    async getInviteByToken(token: string): Promise<Invite | null> {
        // We use a custom SECURITY DEFINER RPC to bypass RLS and fetch the masked 
        // organization data (including the plan) for unauthenticated users
        const { data, error } = await supabase.rpc('get_invite_details', { p_token: token });

        if (error) {
            console.error('RPC Error fetching invite:', error);
            return null;
        }

        if (!data) return null;

        return data as Invite;
    },

    /**
     * Mark invite as accepted.
     */
    async acceptInvite(token: string): Promise<boolean> {
        const { error } = await supabase
            .from('organization_invites')
            .update({ status: 'accepted' })
            .eq('token', token);

        return !error;
    }
};
