require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('chakra_stickies').insert([{ content: 'test', color: 'yellow' }]).select();
  console.log(error);
}
test();
