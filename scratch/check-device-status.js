const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
  const email = 'trazappadmin@admin.com';
  const password = 'Seba4794!';

  console.log("Logging in as admin...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authErr) {
    console.error("Login err:", authErr);
    return;
  }

  const { data, error } = await supabase
    .from('trazapp_devices')
    .select('device_id, organization_id, user_id, is_provisioned, alias, room_id')
    .eq('device_id', 'TrazApp_A5F4')
    .maybeSingle();

  if (error) {
    console.error("Error fetching device:", error);
  } else {
    console.log("Device in database:", data);
  }
}

run();
