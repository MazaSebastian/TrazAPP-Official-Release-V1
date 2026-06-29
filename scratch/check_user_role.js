const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
  const email = 'trazappadmin@admin.com';
  const password = 'Seba4794!';

  const { data: authData } = await supabase.auth.signInWithPassword({ email, password });
  const userId = authData.user.id;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  console.log("User ID:", userId);
  console.log("Profile Role:", profile ? profile.role : "not found");
}

run();
