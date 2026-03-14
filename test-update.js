require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function test() {
  // We need a superadmin or auth token to update a profile or just look at DB schema
  // Let's use service key if available
  const adminKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminClient = adminKey ? createClient(process.env.REACT_APP_SUPABASE_URL, adminKey) : supabase;
  
  // just get table info
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log("Profiles sample:", data ? Object.keys(data[0]) : error);
  
  const { data: orgData, error: orgErr } = await supabase.from('organizations').select('*').limit(1);
  console.log("Orgs sample:", orgData ? Object.keys(orgData[0]) : orgErr);
}
test();
