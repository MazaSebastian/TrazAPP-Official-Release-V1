
import { supabase, getSelectedOrgId } from './supabaseClient';
import { notificationService } from './notificationService';

export interface CashMovement {
    id?: string;
    type: 'INGRESO' | 'EGRESO';
    concept: string;
    amount: number;
    date: string;
    owner: 'Sebastian' | 'Santiago' | string;
    created_at?: string;
    // Legacy fields likely not needed for new UI but present in DB
    owner_id?: string;
    organization_id?: string;
    // New fields
    payment_method?: string;
    responsible_user_id?: string;
    profiles?: { full_name: string, role: string }; // For the joined user full name and role
}

export const getAreaFromRole = (role?: string) => {
    if (!role) return 'Otros';
    const lower = role.toLowerCase();
    if (lower.includes('grower') || lower.includes('cultivo') || lower.includes('operario')) return 'Área de Cultivo';
    if (lower.includes('medico') || lower.includes('médico')) return 'Área de Medicina';
    if (lower.includes('admin')) return 'Área Administrativa';
    return 'Otros';
};

export const expensesService = {
    async getMovements() {
        if (!supabase) return [];
        console.log("Fetching movements...");
        const { data, error } = await supabase
            .from('chakra_expenses')
            .select(`
                *,
                profiles:responsible_user_id ( full_name, role )
            `)
            .eq('organization_id', getSelectedOrgId())
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching movements:', error);
            return [];
        }
        return data as CashMovement[];
    },

    async createMovement(movement: CashMovement) {
        if (!supabase) return { success: false, error: "No Supabase client" };

        // Do not auto-generate string IDs, let Supabase generate the UUID
        const payload = { ...movement, organization_id: getSelectedOrgId() };
        delete payload.id; // Ensure we don't accidentally pass a blank ID

        const { data, error } = await supabase
            .from('chakra_expenses')
            .insert([payload])
            .select();

        if (error) {
            console.error('Error creating movement:', error);
            return { success: false, error: error.message || JSON.stringify(error) };
        }
        if (data?.[0]) {
            const m = data[0];
            // Get Current User for Notification Attribution
            const { data: { user } } = await supabase.auth.getUser();
            const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || m.owner || 'Alguien';

            // Fire and forget notification
            notificationService.sendSelfNotification(
                `Nuevo ${m.type === 'INGRESO' ? 'Ingreso 💰' : 'Gasto 💸'} (${userName})`,
                `${m.concept}: $${m.amount}`
            );
        }

        return { success: true, data: data?.[0] as CashMovement };
    },

    async deleteMovement(id: string) {
        if (!supabase) return false;
        const { error } = await supabase
            .from('chakra_expenses')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting movement:', error);
            return false;
        }
        return true;
    }
};
