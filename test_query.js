import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
async function go() {
  const {data} = await supabase.from('batches').select('tracking_code, children:batches!parent_batch_id(id)').eq('quantity', 0).ilike('discard_reason', '%Distribuido%').limit(2);
  console.log(JSON.stringify(data, null, 2));
}
go();
