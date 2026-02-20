require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
async function test() {
  const { error } = await supabase.from('chakra_stock_items').select('*').limit(1);
  console.log('Error selecting chakra_stock_items:', error);
  const { error: error2 } = await supabase.from('chakra_stock_items').insert([{ 
      nombre: 'test', 
      categoria: 'semillas', 
      precio_actual: 0, 
      stock_actual: 0, 
      stock_minimo: 0, 
      organization_id: '00000000-0000-0000-0000-000000000000' 
  }]).select();
  console.log('Error inserting chakra_stock_items:', error2);
}
test();
