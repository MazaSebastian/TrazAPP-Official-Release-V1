import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function check() {
  console.log("Fetching genetic '111asd'...");
  const { data: gen, error: errGen } = await supabase.from('genetics').select('id, name').eq('name', '111asd').single();
  
  if (errGen || !gen) {
     console.error("Genetic not found", errGen);
     return;
  }
  
  console.log(`Found Genetic: ${gen.name} (${gen.id})`);
  
  const { data: batches, error } = await supabase.from('batches').select('id, quantity, stage, current_room_id, room:rooms(id, name, spot:chakra_crops(name))').eq('genetic_id', gen.id);
  
  if (error) console.error(error);
  else console.log("All Batches for this genetic:", JSON.stringify(batches, null, 2));
}

check();
