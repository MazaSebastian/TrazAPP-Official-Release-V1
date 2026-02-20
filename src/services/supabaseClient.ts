import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables!");
}

console.log("Supabase Client Init - URL:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getSelectedOrgId = (): string | null => {
  return localStorage.getItem('selectedOrganizationId');
};

export default supabase;
