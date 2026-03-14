require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const key = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, key);

async function check() {
  const { data, error } = await supabase.from('organizations').select('*').limit(1);
  if (data) console.log(Object.keys(data[0]));
  if (error) console.error(error);
}
check();
