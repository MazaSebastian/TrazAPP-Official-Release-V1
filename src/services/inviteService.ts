import { supabase } from './supabaseClient';

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
    async createInvite(orgId: string, email: string, role: string = 'staff'): Promise<Invite | null> {
        // 1. Check if invite already exists
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
        const { data, error } = await supabase
            .from('organization_invites')
            .select('*, organization:organizations(*)')
            .eq('token', token)
            .single();

        if (error) return null;
        return data;
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
