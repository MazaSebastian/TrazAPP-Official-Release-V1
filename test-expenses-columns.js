require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('chakra_expenses').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    // Try to insert an empty row to see error
    const { error: e2 } = await supabase.from('chakra_expenses').insert([{}]).select();
    console.log("Insert empty error:", e2);
  }
}
test();
