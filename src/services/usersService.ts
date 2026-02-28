import { supabase } from './supabaseClient';

export interface Profile {
    id: string;
    full_name: string;
    role: string;
    avatar_url?: string;
    email?: string;
}

export const usersService = {
    async getUsers(): Promise<Profile[]> {
        if (!supabase) return [];

        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // 2. Get current user's organization_id
        const { data: orgMemberData, error: orgMemberError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single();

        if (orgMemberError || !orgMemberData?.organization_id) {
            console.error('Error fetching user organization:', orgMemberError);
            return [];
        }

        // 3. Get all profiles that belong to this organization_id
        const { data: members, error: membersError } = await supabase
            .from('organization_members')
            .select(`
                user_id,
                profiles:user_id (
                    id,
                    full_name,
                    role,
                    avatar_url,
                    email
                )
            `)
            .eq('organization_id', orgMemberData.organization_id);

        if (membersError) {
            console.error('Error fetching organization profiles:', membersError);
            return [];
        }

        // 4. Flatten the joined data
        const profiles = members
            ?.map(m => m.profiles)
            .filter(Boolean)
            .flat() as Profile[];

        // Sort alphabetically
        return profiles.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    },

    async getProfileById(id: string): Promise<Profile | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }

        return data as Profile;
    }
};
