import { supabase, getSelectedOrgId } from './supabaseClient';

export interface TrazAppApiKey {
  id: string;
  organization_id: string;
  name: string;
  key: string;
  key_prefix: string;
  permissions: string[];
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
}

export const apiKeyService = {
  /**
   * List all API keys belonging to the active organization
   */
  async getApiKeys(): Promise<TrazAppApiKey[]> {
    if (!supabase) return [];
    const orgId = getSelectedOrgId();
    if (!orgId) return [];

    const { data, error } = await supabase
      .from('trazapp_api_keys')
      .select('id, organization_id, name, key_prefix, permissions, is_active, last_used_at, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      return [];
    }

    return (data || []) as TrazAppApiKey[];
  },

  /**
   * Generate a new API Key for AI Agents
   */
  async createApiKey(name: string, permissions: string[] = ['read', 'write', 'tasks', 'telemetry', 'dispensary', 'metrics']): Promise<{ success: boolean; key?: string; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase no inicializado' };
    const orgId = getSelectedOrgId();
    if (!orgId) return { success: false, error: 'No hay organización seleccionada' };

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      // Generate a secure random token
      const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const fullKey = `tz_live_${randomHex}`;
      const keyPrefix = `${fullKey.slice(0, 14)}...`;

      const { data, error } = await supabase
        .from('trazapp_api_keys')
        .insert({
          organization_id: orgId,
          created_by: userId || null,
          name: name.trim(),
          key: fullKey,
          key_prefix: keyPrefix,
          permissions,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating API key:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        key: fullKey, // Return the full key once so the user can copy it
      };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Error desconocido al crear API Key' };
    }
  },

  /**
   * Revoke (deactivate) an API key
   */
  async revokeApiKey(id: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('trazapp_api_keys')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error revoking API key:', error);
      return false;
    }

    return true;
  },

  /**
   * Permanently delete an API key
   */
  async deleteApiKey(id: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
      .from('trazapp_api_keys')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting API key:', error);
      return false;
    }

    return true;
  },
};
