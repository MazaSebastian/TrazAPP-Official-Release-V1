import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log("Checking recent insumos...");
  const { data: insumos } = await supabase.from('chakra_stock_items').select('id, nombre, precio_actual, stock_actual, created_at').order('created_at', { ascending: false }).limit(3);
  console.log(insumos);

  console.log("\nChecking recent expenses...");
  const { data: expenses } = await supabase.from('chakra_expenses').select('id, concept, amount, type, owner, created_at').order('created_at', { ascending: false }).limit(5);
  console.log(expenses);
}
check();
