import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('batches')
    .select('id, name, quantity, clone_map_id, tracking_code, discarded_at')
    .order('created_at', { ascending: false })
    .limit(20);
  console.log(data);
}
run();
