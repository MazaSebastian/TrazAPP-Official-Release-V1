require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function checkProfiles() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    console.log("Profiles data:", data);
    console.log("Error:", error);
}

checkProfiles();
