const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
  const email = 'trazappadmin@admin.com';
  const password = 'Seba4794!';

  console.log("Logging in as super_admin...");
  const { data: authData } = await supabase.auth.signInWithPassword({ email, password });
  
  console.log("Fetching profiles...");
  const { data: profiles, error: err } = await supabase
    .from('profiles')
    .select('*');
  
  if (err) {
    console.error("Error fetching profiles:", err);
    return;
  }
  
  console.log("Profiles list:", profiles);

  console.log("Fetching organization members...");
  const { data: members, error: err2 } = await supabase
    .from('organization_members')
    .select('user_id, organization_id, role');

  if (err2) {
    console.error("Error fetching organization members:", err2);
    return;
  }

  console.log("Organization members list:", members);
}

run();
