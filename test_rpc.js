const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
    console.log("Fetching a batch to steal the org ID...");
    // Bypass RLS? No, we might need a logged-in user or just query if RLS allows anon read
    const { data: batches, error: bError } = await supabase.from('batches').select('organization_id').limit(1);

    if (bError) {
        console.error("Error fetching batches:", bError);
        return;
    }

    if (!batches || batches.length === 0) {
        console.log("No batches found! Maybe they were already deleted?");
        return;
    }

    const orgId = batches[0].organization_id;
    console.log("Test Org ID:", orgId);

    console.log("Calling clear_test_metrics...");
    const { data, error } = await supabase.rpc('clear_test_metrics', { p_org_id: orgId });
    console.log("Result:", data);
    console.log("Error:", error);
}
run();
