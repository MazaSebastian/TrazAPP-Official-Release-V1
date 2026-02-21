require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkPolicies() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        console.error("No service key.");
        return;
    }
    const adminSupabase = createClient(process.env.REACT_APP_SUPABASE_URL, serviceKey);

    const { data, error } = await adminSupabase
        .from('organization_members')
        .select('*');

    console.log("Total members in DB (bypassing RLS):", data ? data.length : 0);

    // We cannot query pg_policies directly via REST API usually, but let's try via RPC if exists, or just do a raw postgres fetch if we had the connection string.
    // Instead, let's look at the user 'cf5f6945-ff91-4ec4-ac0f-7651aca3e898'
    const seba = data.filter(m => m.user_id === 'cf5f6945-ff91-4ec4-ac0f-7651aca3e898');
    console.log("Seba's specific rows:", seba);
}

checkPolicies();
