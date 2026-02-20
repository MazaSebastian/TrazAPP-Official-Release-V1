require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use the Service Role Key to inspect policies, or just query without it to see if we get all rows
// Actually we only have ANON_KEY in .env, so we'll just try to select all from organization_members
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('organization_members').select('*');
  console.log("organization_members count:", data ? data.length : "error", error);
  
  const { data: orgs, error: e2 } = await supabase.from('organizations').select('*');
  console.log("organizations count:", orgs ? orgs.length : "error", e2);
}
test();
