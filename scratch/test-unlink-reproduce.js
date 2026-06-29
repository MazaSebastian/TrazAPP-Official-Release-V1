const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
  const adminEmail = 'trazappadmin@admin.com';
  const adminPassword = 'Seba4794!';

  console.log("1. Logging in as super_admin...");
  const { data: adminAuth, error: adminAuthErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword
  });

  if (adminAuthErr) {
    console.error("Admin login failed:", adminAuthErr);
    return;
  }

  // Create a new normal user for testing
  const testUserEmail = `test_normal_${Date.now()}@example.com`;
  const testUserPassword = 'TestPassword123!';
  const orgName = `Test Org ${Date.now()}`;

  console.log(`2. Creating a test organization: ${orgName}...`);
  const { data: orgData, error: orgErr } = await supabase
    .from('organizations')
    .insert({ name: orgName })
    .select()
    .single();

  if (orgErr) {
    console.error("Org creation failed:", orgErr);
    return;
  }
  const orgId = orgData.id;
  console.log("Org created with ID:", orgId);

  console.log(`3. Creating a normal user via edge function/signup...`);
  // Since we cannot easily sign up with metadata, we can just sign up normal email/password
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email: testUserEmail,
    password: testUserPassword,
  });

  if (signUpErr) {
    console.error("Sign up failed:", signUpErr);
    return;
  }
  const testUserId = signUpData.user.id;
  console.log("User signed up with ID:", testUserId);

  console.log("4. Adding user to organization members as owner...");
  const { error: memberErr } = await supabase
    .from('organization_members')
    .insert({
      organization_id: orgId,
      user_id: testUserId,
      role: 'owner'
    });

  if (memberErr) {
    console.error("Failed to add to organization members:", memberErr);
    return;
  }
  console.log("User added to org members successfully.");

  console.log("5. Link device to this new organization...");
  // Let's use the first device (TrazApp_A5F4)
  const deviceId = 'TrazApp_A5F4';
  const { error: linkErr } = await supabase
    .from('trazapp_devices')
    .update({
      organization_id: orgId,
      user_id: testUserId,
      is_provisioned: true,
      alias: 'Test Device'
    })
    .eq('device_id', deviceId);

  if (linkErr) {
    console.error("Failed to link device as admin:", linkErr);
    return;
  }
  console.log("Device linked to test org.");

  // Log out admin
  await supabase.auth.signOut();

  console.log(`6. Logging in as normal user: ${testUserEmail}...`);
  const { data: normalAuth, error: normalAuthErr } = await supabase.auth.signInWithPassword({
    email: testUserEmail,
    password: testUserPassword
  });

  if (normalAuthErr) {
    console.error("Normal user login failed:", normalAuthErr);
    return;
  }

  console.log("7. Testing unlink from normal user account...");
  const { data: unlinkData, error: unlinkErr } = await supabase
    .from('trazapp_devices')
    .update({
      organization_id: null,
      user_id:         null,
      is_provisioned:  false,
      alias:           null,
      room_id:         null,
    })
    .eq('device_id', deviceId)
    .select();

  if (unlinkErr) {
    console.error("Unlink failed for normal user:", unlinkErr);
  } else {
    console.log("Unlink succeeded for normal user!", unlinkData);
  }
}

run();
