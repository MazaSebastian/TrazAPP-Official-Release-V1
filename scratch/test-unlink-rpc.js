const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
  const email = 'trazappadmin@admin.com';
  const password = 'Seba4794!';

  console.log("Logging in...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authErr) {
    console.error("Login err:", authErr);
    return;
  }

  const deviceId = 'TrazApp_A5F4';
  console.log(`Calling unlink_device RPC for: ${deviceId}...`);

  const { data, error } = await supabase
    .rpc('unlink_device', { p_device_id: deviceId });

  if (error) {
    console.error("RPC failed:", error);
  } else {
    console.log("RPC succeeded! Output:", data);
  }
}

run();
