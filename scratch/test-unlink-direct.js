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

  const userId = authData.user.id;
  console.log("Logged in as:", userId);

  console.log("Fetching devices...");
  const { data: devices, error: devErr } = await supabase
    .from('trazapp_devices')
    .select('*');

  if (devErr) {
    console.error("Fetch devices err:", devErr);
    return;
  }

  console.log("Found devices:", devices.map(d => ({ device_id: d.device_id, organization_id: d.organization_id })));

  if (devices.length === 0) {
    console.log("No devices found to test unlinking.");
    return;
  }

  const targetDevice = devices[0];
  console.log(`Attempting to unlink device: ${targetDevice.device_id} (current org: ${targetDevice.organization_id})...`);

  const { data: updateData, error: updateErr } = await supabase
    .from('trazapp_devices')
    .update({
      organization_id: null,
      user_id:         null,
      is_provisioned:  false,
      alias:           null,
      room_id:         null,
    })
    .eq('device_id', targetDevice.device_id)
    .select();

  if (updateErr) {
    console.error("Update failed:", updateErr);
  } else {
    console.log("Update succeeded!", updateData);
  }
}

run();
