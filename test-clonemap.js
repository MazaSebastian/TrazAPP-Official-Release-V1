require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('clone_maps').insert([{ name: 'test', room_id: '00000000-0000-0000-0000-000000000000', grid_rows: 1, grid_columns: 1, organization_id: '00000000-0000-0000-0000-000000000000' }]).select();
  console.log(error);
}
test();
