import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: batches } = await supabase.from('batches').select('*').ilike('name', '%910%').limit(5);
  console.log("Batches:", batches?.map(b => ({id: b.id, name: b.name})));
  
  if (batches && batches.length > 0) {
    const batch = batches[0];
    const { data: logs, error: lErr } = await supabase.from('logs').select('*').eq('batch_id', batch.id);
    console.log("Logs error:", lErr);
    console.log("Logs count:", logs?.length);

    const { data: movs, error: mErr } = await supabase.from('batch_movements').select('*').eq('batch_id', batch.id);
    console.log("Movs error:", mErr);
    console.log("Movs count:", movs?.length);
    
    // Check if tasks were logged via room or something else?
  }
}
run();
