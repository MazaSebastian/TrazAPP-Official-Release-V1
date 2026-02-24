import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: rooms } = await supabase.from('rooms').select('*');
  const { data: batches } = await supabase.from('batches').select('*, room:rooms(id, name, type)');
  console.log("Rooms:");
  rooms.forEach(r => console.log(`- ${r.name} (Type: ${r.type}, ID: ${r.id})`));
  console.log("\nBatches in clone rooms:");
  batches.filter(b => b.room && ['clones', 'esquejes', 'esquejera'].includes(b.room.type?.toLowerCase())).forEach(b => {
    console.log(`- Batch: ${b.name}, Room: ${b.room.name}, Type: ${b.room.type}`);
  });
}
run();
