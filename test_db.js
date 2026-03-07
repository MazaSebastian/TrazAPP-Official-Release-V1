const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
    console.log("Fetching all movements...");
    const { data: allMovs, error: e1 } = await supabase.from('chakra_dispensary_movements').select('*').order('created_at', { ascending: false }).limit(5);
    console.log("All movements (raw):", JSON.stringify(allMovs, null, 2));
    if (e1) console.error(e1);

    console.log("Fetching all batches...");
    const { data: allBatches, error: e2 } = await supabase.from('chakra_dispensary_batches').select('id, organization_id, strain_name').limit(2);
    console.log("Batches:", JSON.stringify(allBatches, null, 2));
    if (e2) console.error(e2);
}
run();
