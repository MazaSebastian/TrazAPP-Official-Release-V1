import { supabase, getSelectedOrgId } from './supabaseClient';


export interface InsumoProvider {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contact_name: string | null;
  created_at?: string;
}

export interface InsumoPurchaseOrder {
  id: string;
  organization_id: string;
  insumo_id: string;
  provider_id: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'CANCELLED';
  quantity_requested: number;
  ai_generated: boolean;
  ordered_at: string;
  
  // Joined fields for UI convenience
  insumos?: { nombre: string; unit_of_measurement: string; total_volume: number };
  providers?: { name: string };
}

export const getInsumoProviders = async (): Promise<InsumoProvider[]> => {
  const orgId = getSelectedOrgId();
  if (!orgId) return [];
  
  const { data, error } = await supabase
    .from('insumo_providers')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');
    
  if (error) {
    console.error("Error fetching providers:", error);
    throw error;
  }
  return data || [];
};

export const createProvider = async (provider: Omit<InsumoProvider, 'id' | 'organization_id' | 'created_at'>): Promise<InsumoProvider> => {
  const orgId = getSelectedOrgId();
  if (!orgId) throw new Error("No organization selected");

  const { data, error } = await supabase
    .from('insumo_providers')
    .insert([{ ...provider, organization_id: orgId }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProvider = async (id: string, updates: Partial<InsumoProvider>): Promise<InsumoProvider> => {
  const orgId = getSelectedOrgId();
  if (!orgId) throw new Error("No organization selected");

  const { data, error } = await supabase
    .from('insumo_providers')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', orgId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProvider = async (id: string): Promise<void> => {
  const orgId = getSelectedOrgId();
  if (!orgId) throw new Error("No organization selected");

  const { error } = await supabase
    .from('insumo_providers')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) throw error;
};

// --- Purchase Orders ---

export const getPurchaseOrders = async (): Promise<InsumoPurchaseOrder[]> => {
  const orgId = getSelectedOrgId();
  if (!orgId) return [];

    const { data, error } = await supabase
      .from('insumo_purchase_orders')
      .select(`
        *,
        insumos:chakra_stock_items(nombre, unit_of_measurement, total_volume),
        providers:insumo_providers(name)
      `)
    .eq('organization_id', orgId)
    .order('ordered_at', { ascending: false });

  if (error) throw error;
  return data as any; // Type assertion needed due to join structure
};

export const updateOrderStatus = async (id: string, status: InsumoPurchaseOrder['status']): Promise<void> => {
  const orgId = getSelectedOrgId();
  if (!orgId) throw new Error("No organization selected");

  const { error } = await supabase
    .from('insumo_purchase_orders')
    .update({ status })
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) throw error;
};
