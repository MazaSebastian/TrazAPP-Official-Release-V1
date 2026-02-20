require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('chakra_stock_items').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("Found existing columns:", Object.keys(data[0]));
  } else if (data && data.length === 0) {
    // We inserted nothing, so it's empty, but the select succeeded, meaning table exists.
    // Insert a dummy without the new fields to see what columns exist by fetching it
    const dummy = { nombre: 'dummy', type: 'dummy', quantity: 1, unit: 'u', organization_id: '00000000-0000-0000-0000-000000000000'};
    const { error: e2 } = await supabase.from('chakra_stock_items').insert([dummy]);
    const { data: d3 } = await supabase.from('chakra_stock_items').select('*').limit(1);
    if(d3 && d3.length > 0) console.log("Columns after insert:", Object.keys(d3[0]));
  }
}
test();
