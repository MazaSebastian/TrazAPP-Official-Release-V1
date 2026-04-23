import { supabase } from './supabaseClient';
import { DispensaryBatch } from './dispensaryService';

export interface DispensaryOrder {
    id: string;
    organization_id: string;
    member_id: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    total_price: number;
    notes?: string;
    staff_notes?: string;
    created_at: string;
    updated_at: string;
    items?: DispensaryOrderItem[];
}

export interface DispensaryOrderItem {
    id: string;
    order_id: string;
    batch_id: string;
    quantity: number;
    price_per_unit: number;
    created_at: string;
    batch?: DispensaryBatch;
}

export const orderService = {
    /**
     * Create a new order with items.
     */
    async createOrder(
        organizationId: string,
        items: { batchId: string, quantity: number, pricePerUnit: number }[],
        notes: string = ''
    ): Promise<DispensaryOrder | null> {
        if (!supabase) return null;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const totalPrice = items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);

        // 1. Create the base Order
        const { data: order, error: orderError } = await supabase
            .from('dispensary_orders')
            .insert([{
                organization_id: organizationId,
                member_id: user.id,
                status: 'pending',
                total_price: totalPrice,
                notes
            }])
            .select()
            .single();

        if (orderError || !order) {
            console.error('Error creating order:', orderError);
            return null;
        }

        // 2. Create the Order Items
        const orderItemsData = items.map(item => ({
            order_id: order.id,
            batch_id: item.batchId,
            quantity: item.quantity,
            price_per_unit: item.pricePerUnit
        }));

        const { error: itemsError } = await supabase
            .from('dispensary_order_items')
            .insert(orderItemsData);

        if (itemsError) {
            console.error('Error creating order items:', itemsError);
            // Ideally we'd rollback the order here or handle it with an RPC transaction
            return null;
        }

        return order as DispensaryOrder;
    },

    /**
     * Get all orders for the current user.
     */
    async getMyOrders(): Promise<DispensaryOrder[]> {
        if (!supabase) return [];

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('dispensary_orders')
            .select(`
                *,
                items:dispensary_order_items (
                    *,
                    batch:batch_id (
                        batch_code,
                        strain_name,
                        product_type,
                        product_name,
                        photo_url,
                        unit
                    )
                )
            `)
            .eq('member_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            return [];
        }

        return data as DispensaryOrder[];
    },

    /**
     * Get all orders for an organization (for Admins).
     */
    async getOrganizationOrders(organizationId: string, statusFilter?: 'pending' | 'approved' | 'rejected' | 'completed'): Promise<DispensaryOrder[]> {
        if (!supabase) return [];

        let query = supabase
            .from('dispensary_orders')
            .select(`
                *,
                member:member_id (
                    full_name,
                    email
                ),
                items:dispensary_order_items (
                    *,
                    batch:batch_id (
                        batch_code,
                        strain_name,
                        product_type,
                        product_name,
                        unit
                    )
                )
            `)
            .eq('organization_id', organizationId);

        if (statusFilter) {
            query = query.eq('status', statusFilter);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching organization orders:', error);
            return [];
        }

        return data as DispensaryOrder[];
    },

    /**
     * Update order status (for Admins).
     */
    async updateOrderStatus(orderId: string, status: 'pending' | 'approved' | 'rejected' | 'completed', staffNotes?: string): Promise<boolean> {
        if (!supabase) return false;

        const updateData: any = { status };
        if (staffNotes !== undefined) {
            updateData.staff_notes = staffNotes;
        }

        const { error } = await supabase
            .from('dispensary_orders')
            .update(updateData)
            .eq('id', orderId);

        if (error) {
            console.error('Error updating order status:', error);
            return false;
        }

        return true;
    }
};
