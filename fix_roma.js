const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  // 1. Find Roma's profile and aurora_patients record
  const userId = 'e5022a80-5480-48d7-bb72-000566baa265'; // From the screenshot
  
  // 2. Get her organization from aurora_patients
  const { data: patient, error: pErr } = await supabase
    .from('aurora_patients')
    .select('organization_id')
    .eq('profile_id', userId)
    .single();

  console.log("Patient:", patient, "Error:", pErr);

  if (patient) {
    // 3. Check if she already has an organization_members record
    const { data: existing } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', patient.organization_id);
    
    console.log("Existing members:", existing);
  }
}
fix();
