require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('cash_movements').select('*').limit(1);
  console.log("cash_movements select error:", error);
  
  const { data: d2, error: e2 } = await supabase.from('chakra_expenses').select('*').limit(1);
  console.log("chakra_expenses select error:", e2);

  const { data: d3, error: e3 } = await supabase.from('expenses').select('*').limit(1);
  console.log("expenses select error:", e3);
}
test();
