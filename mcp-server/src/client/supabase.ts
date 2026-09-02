import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getConfig } from '../config.js';

let supabaseInstance: SupabaseClient | null = null;
let resolvedTenantCache: { organizationId: string; organizationName: string; userId?: string } | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const config = getConfig();
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error(
        'TrazAPP MCP: Credenciales de Supabase no encontradas. Configura TRAZAPP_SUPABASE_URL y TRAZAPP_SUPABASE_KEY en el entorno.'
      );
    }
    supabaseInstance = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseInstance;
}

/**
 * Resolves and validates the tenant context from TRAZAPP_API_KEY or TRAZAPP_ORGANIZATION_ID.
 * Throws an error if no tenant context is provided, preventing accidental global data leaks.
 */
export async function resolveTenantContext(orgIdOverride?: string): Promise<{
  organizationId: string;
  organizationName: string;
  userId?: string;
}> {
  if (orgIdOverride) {
    return {
      organizationId: orgIdOverride,
      organizationName: 'Club Específico',
    };
  }

  if (resolvedTenantCache) {
    return resolvedTenantCache;
  }

  const config = getConfig();
  const supabase = getSupabaseClient();

  // 1. Validate by TRAZAPP_API_KEY if present
  if (config.apiKey) {
    try {
      const { data, error } = await supabase.rpc('validate_trazapp_api_key', {
        p_api_key: config.apiKey,
      });

      if (!error && data && data.valid) {
        resolvedTenantCache = {
          organizationId: data.organization_id,
          organizationName: data.organization_name || 'Club TrazAPP',
          userId: data.user_id,
        };
        return resolvedTenantCache;
      }
    } catch (e) {
      // Fallback to direct query on trazapp_api_keys if RPC not yet created
      const { data: keyData, error: keyErr } = await supabase
        .from('trazapp_api_keys')
        .select('id, organization_id, created_by, is_active')
        .eq('key', config.apiKey)
        .eq('is_active', true)
        .single();

      if (!keyErr && keyData) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', keyData.organization_id)
          .single();

        resolvedTenantCache = {
          organizationId: keyData.organization_id,
          organizationName: orgData?.name || 'Club TrazAPP',
          userId: keyData.created_by,
        };
        return resolvedTenantCache;
      }
    }

    throw new Error(
      'TrazAPP MCP: La clave de API (TRAZAPP_API_KEY) proporcionada es inválida o fue revocada. Verifica tu clave en el panel de TrazAPP.'
    );
  }

  // 2. Fallback to direct TRAZAPP_ORGANIZATION_ID
  if (config.organizationId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', config.organizationId)
      .single();

    resolvedTenantCache = {
      organizationId: config.organizationId,
      organizationName: org?.name || 'Club TrazAPP',
      userId: config.userId,
    };
    return resolvedTenantCache;
  }

  // 3. Strict guard: Refuse to execute globally
  throw new Error(
    'TrazAPP MCP: Acceso restringido por seguridad multi-tenant. Debes proporcionar tu TRAZAPP_API_KEY o TRAZAPP_ORGANIZATION_ID para que el agente acceda exclusivamente a los datos de tu club.'
  );
}

export async function authenticateWithApiKey(apiKey: string): Promise<{
  organizationId: string;
  organizationName: string;
  userId?: string;
}> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('validate_trazapp_api_key', {
    p_api_key: apiKey.trim(),
  });

  if (error || !data || !data.valid) {
    throw new Error(data?.error || error?.message || 'API Key inválida, inactiva o expirada.');
  }

  resolvedTenantCache = {
    organizationId: data.organization_id,
    organizationName: data.organization_name || 'Club TrazAPP',
    userId: data.user_id,
  };

  return resolvedTenantCache;
}

/**
 * Apply organization filter to query, strictly scoping to resolved tenant
 */
export async function scopeQueryToOrg(query: any, orgIdOverride?: string) {
  const tenant = await resolveTenantContext(orgIdOverride);
  return query.eq('organization_id', tenant.organizationId);
}
