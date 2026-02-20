require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('chakra_expenses').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    // Try to insert a valid row, capturing any missing column errors
    const dummy = { type: 'EGRESO', concept: 'test', amount: 1, date: '2023-01-01', owner: 'test', organization_id: '00000000-0000-0000-0000-000000000000' };
    const { error: e2 } = await supabase.from('chakra_expenses').insert([dummy]).select();
    console.log("Insert specific error:", e2);
  }
}
test();
