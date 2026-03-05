import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: tasks } = await supabase.from('chakra_tasks').select('id').limit(1);
  if (tasks.length) {
    const { error } = await supabase.from('chakra_tasks').delete().eq('id', tasks[0].id);
    console.log(JSON.stringify(error, null, 2));
  }
}
run();
