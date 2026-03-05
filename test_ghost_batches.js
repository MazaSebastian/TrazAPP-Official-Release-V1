import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function check() {
  const { data: gen, error: errGen } = await supabase.from('genetics').select('id, name').eq('name', '111asd').single();
  if (errGen || !gen) return;
  
  const { data: activeBatches, error } = await supabase.from('batches')
    .select('id, quantity, stage, current_room_id, room:rooms(name)')
    .eq('genetic_id', gen.id)
    .neq('stage', 'completed')
    .neq('stage', 'discarded');
    
  console.log("Active Batches for 111asd (not completed/discarded):", JSON.stringify(activeBatches, null, 2));
}
check();
