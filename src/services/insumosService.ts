import { supabase, getSelectedOrgId } from './supabaseClient';
import type { Insumo, HistorialPrecio, InsumoCategory } from '../types';
import { notificationService } from './notificationService';
import { v4 as uuidv4 } from 'uuid';

export async function uploadTicket(file: File): Promise<string | null> {
  try {
    if (!supabase) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${getSelectedOrgId()}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('supply_tickets')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error subiendo ticket:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('supply_tickets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error('Error in uploadTicket:', err);
    return null;
  }
}

// Obtener todos los insumos
export async function getInsumos(): Promise<Insumo[]> {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('chakra_stock_items')
      .select('*')
      .eq('organization_id', getSelectedOrgId())
      .eq('activo', true)
      .order('nombre');

    if (error) {
      console.error('Error al obtener insumos:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error en getInsumos:', error);
    return [];
  }
}

// Obtener insumo por ID
export async function getInsumoById(id: string): Promise<Insumo | null> {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('chakra_stock_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al obtener insumo:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error en getInsumoById:', error);
    return null;
  }
}

// Crear nuevo insumo
export async function createInsumo(insumo: Omit<Insumo, 'id' | 'created_at' | 'updated_at'>): Promise<Insumo | null> {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('chakra_stock_items')
      .insert([{ ...insumo, organization_id: getSelectedOrgId() }])
      .select()
      .single();

    if (error) {
      console.error('Error al crear insumo:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error en createInsumo:', error);
    return null;
  }
}

// Actualizar insumo existente
export async function updateInsumo(id: string, updates: Partial<Insumo>): Promise<Insumo | null> {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('chakra_stock_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar insumo:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error en updateInsumo:', error);
    return null;
  }
}

// Eliminar insumo (marcar como inactivo)
export async function deleteInsumo(id: string): Promise<boolean> {
  try {
    if (!supabase) return false;

    const { error } = await supabase
      .from('chakra_stock_items')
      .update({ activo: false })
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar insumo:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error en deleteInsumo:', error);
    return false;
  }
}

// Actualizar precio de insumo y crear registro en historial
export async function updateInsumoPrecio(
  id: string,
  nuevoPrecio: number,
  motivo: string,
  proveedor?: string,
  cantidadComprada?: number,
  ticketUrl?: string
): Promise<boolean> {
  try {
    if (!supabase) return false;

    // Obtener insumo actual
    const insumoActual = await getInsumoById(id);
    if (!insumoActual) {
      throw new Error('Insumo no encontrado');
    }

    // Crear registro en historial de precios
    const historialPrecio: Omit<HistorialPrecio, 'id' | 'created_at'> = {
      insumo_id: id,
      precio: nuevoPrecio,
      fecha_cambio: new Date().toISOString().split('T')[0],
      motivo_cambio: motivo as any,
      proveedor,
      cantidad_comprada: cantidadComprada,
      costo_total: cantidadComprada ? nuevoPrecio * cantidadComprada : undefined,
      ticket_url: ticketUrl
    };

    const { error: historialError } = await supabase
      .from('chakra_historial_precios')
      .insert([historialPrecio]);

    if (historialError) {
      console.error('Error al crear historial de precio:', historialError);
      throw historialError;
    }

    const { error: updateError } = await supabase
      .from('chakra_stock_items')
      .update({
        precio_anterior: insumoActual.precio_actual,
        precio_actual: nuevoPrecio,
        fecha_ultimo_precio: new Date().toISOString().split('T')[0],
        fecha_ultima_compra: cantidadComprada ? new Date().toISOString().split('T')[0] : insumoActual.fecha_ultima_compra,
        stock_actual: cantidadComprada ? insumoActual.stock_actual + cantidadComprada : insumoActual.stock_actual,
        ticket_url: ticketUrl !== undefined ? ticketUrl : insumoActual.ticket_url // Actualizar el ticket general si se envió
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error al actualizar precio del insumo:', updateError);
      throw updateError;
    }

    // Notificar
    // Get Current User for Notification Attribution
    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Alguien';

    notificationService.sendSelfNotification(
      `Actualización de Insumo (${userName}) 📦`,
      `${insumoActual.nombre}: Nuevo precio $${nuevoPrecio}` + (cantidadComprada ? ` (Compra: ${cantidadComprada})` : '')
    );

    return true;
  } catch (error) {
    console.error('Error en updateInsumoPrecio:', error);
    return false;
  }
}

// Obtener historial de precios de un insumo
export async function getHistorialPrecios(insumoId: string): Promise<HistorialPrecio[]> {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('chakra_historial_precios')
      .select('*')
      .eq('insumo_id', insumoId)
      .order('fecha_cambio', { ascending: false });

    if (error) {
      console.error('Error al obtener historial de precios:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error en getHistorialPrecios:', error);
    return [];
  }
}

// Obtener estadísticas de insumos
export async function getInsumosStats() {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('chakra_stock_items')
      .select('precio_actual, stock_actual, stock_minimo, precio_anterior')
      .eq('organization_id', getSelectedOrgId())
      .eq('activo', true);

    if (error) {
      console.error('Error al obtener estadísticas:', error);
      return null;
    }

    if (!data) return null;

    const stats = {
      totalInsumos: data.length,
      stockBajo: data.filter(i => i.stock_actual <= i.stock_minimo).length,
      conVariacionPrecio: data.filter(i => i.precio_anterior && i.precio_actual !== i.precio_anterior).length,
      totalValor: data.reduce((sum, i) => sum + (i.precio_actual * i.stock_actual), 0)
    };

    return stats;
  } catch (error) {
    console.error('Error en getInsumosStats:', error);
    return null;
  }
}

// Buscar insumos por término
export async function searchInsumos(searchTerm: string): Promise<Insumo[]> {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('chakra_stock_items')
      .select('*')
      .eq('organization_id', getSelectedOrgId())
      .eq('activo', true)
      .or(`nombre.ilike.%${searchTerm}%,proveedor.ilike.%${searchTerm}%`)
      .order('nombre');

    if (error) {
      console.error('Error al buscar insumos:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error en searchInsumos:', error);
    return [];
  }
}

// Filtrar insumos por categoría
export async function getInsumosByCategory(categoria: string): Promise<Insumo[]> {
  try {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('chakra_stock_items')
      .select('*')
      .eq('organization_id', getSelectedOrgId())
      .eq('activo', true)
      .eq('categoria', categoria)
      .order('nombre');

    if (error) {
      console.error('Error al filtrar insumos por categoría:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error en getInsumosByCategory:', error);
    return [];
  }
}

// Suscribirse a cambios en tiempo real
export function subscribeToInsumosChanges(callback: (payload: any) => void) {
  if (!supabase) return { unsubscribe: () => { } };

  return supabase
    .channel('chakra_insumos_changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'chakra_insumos' },
      callback
    )
    .subscribe();
}

// Suscribirse a cambios en historial de precios
export function subscribeToHistorialChanges(callback: (payload: any) => void) {
  if (!supabase) return { unsubscribe: () => { } };

  return supabase
    .channel('chakra_historial_precios_changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'chakra_historial_precios' },
      callback
    )
    .subscribe();
}

// ==========================================
// MÉTODOS PARA CATEGORÍAS PERSONALIZADAS
// ==========================================

export async function getInsumoCategories(): Promise<InsumoCategory[]> {
  try {
    if (!supabase) return [];
    const orgId = getSelectedOrgId();
    if (!orgId) return [];

    const { data, error } = await supabase
      .from('chakra_insumo_categories')
      .select('*')
      .eq('organization_id', orgId)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error in getInsumoCategories:', error);
    return [];
  }
}

export async function createInsumoCategory(name: string): Promise<InsumoCategory | null> {
  try {
    if (!supabase) return null;
    const orgId = getSelectedOrgId();
    if (!orgId) return null;

    const { data, error } = await supabase
      .from('chakra_insumo_categories')
      .insert([{ organization_id: orgId, name: name.trim() }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { throw new Error('Ya existe una categoría con este nombre'); }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error in createInsumoCategory:', error);
    throw error;
  }
}

export async function deleteInsumoCategory(id: string): Promise<boolean> {
  try {
    if (!supabase) return false;

    // Optional: Verifica si hay insumos usando esta categoría e impede el borrado
    const { data: usageCount, error: countError } = await supabase
      .from('chakra_stock_items')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', getSelectedOrgId())
      .limit(1); // Realmente requeriría JOIN o check cruzado en API.

    const { error } = await supabase
      .from('chakra_insumo_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error in deleteInsumoCategory:', error);
    throw error;
  }
}
