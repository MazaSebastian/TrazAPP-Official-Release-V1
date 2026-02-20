require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('chakra_stock_items').insert([{}]).select();
  console.log("Insert empty row error (to see what columns it expects or fails on):", error);
}
run();
