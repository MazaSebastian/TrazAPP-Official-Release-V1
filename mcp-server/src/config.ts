import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from cwd and from server root / parent directories
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

export interface ServerConfig {
  supabaseUrl: string;
  supabaseKey: string;
  apiKey?: string;
  organizationId?: string;
  organizationName?: string;
  userId?: string;
}

export function getConfig(): ServerConfig {
  const supabaseUrl = process.env.TRAZAPP_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '';
  const supabaseKey =
    process.env.TRAZAPP_SUPABASE_KEY ||
    process.env.TRAZAPP_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.TRAZAPP_SUPABASE_ANON_KEY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
    '';

  const apiKey = process.env.TRAZAPP_API_KEY;
  const organizationId = process.env.TRAZAPP_ORGANIZATION_ID;
  const userId = process.env.TRAZAPP_USER_ID;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '[TrazAPP MCP] Advertencia: TRAZAPP_SUPABASE_URL o TRAZAPP_SUPABASE_KEY no están definidos. El servidor podría fallar al realizar consultas.'
    );
  }

  return {
    supabaseUrl,
    supabaseKey,
    organizationId,
    userId,
  };
}
