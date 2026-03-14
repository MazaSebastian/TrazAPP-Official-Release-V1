import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''; // Actually need service key for schema change, but we can do an RPC or just alter table if anon has permissions (unlikely)

// Let's do it via sql if we can. 
// Standard schema update for organizations:
// ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS is_revenue_exempt boolean DEFAULT false;
