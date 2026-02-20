const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL || envConfig.REACT_APP_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || envConfig.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching dispensary batches with null organization_id...");
    const { data: batches, error } = await supabase
        .from('chakra_dispensary_batches')
        .select('id, batch_code, organization_id')
        .is('organization_id', null);

    if (error) {
        console.error("Error fetching dispensary batches:", error);
        return;
    }

    console.log(`Found ${batches.length} dispensary batches with null organization_id.`);

    if (batches.length === 0) return;

    // We need to guess the organization ID. We can grab the organization ID of a known batch in the system
    const { data: anyValidBatch } = await supabase
        .from('batches')
        .select('organization_id')
        .not('organization_id', 'is', null)
        .limit(1);

    if (!anyValidBatch || anyValidBatch.length === 0) {
        console.error("Could not find any valid organization_id in the system to inherit from.");
        return;
    }

    const orgId = anyValidBatch[0].organization_id;
    console.log("Using organization ID:", orgId);

    let updatedCount = 0;

    for (const batch of batches) {
        const { error: updErr } = await supabase
            .from('chakra_dispensary_batches')
            .update({ organization_id: orgId })
            .eq('id', batch.id);

        if (updErr) {
            console.error(`Error updating batch ${batch.id}:`, updErr);
        } else {
            updatedCount++;
        }
    }

    console.log(`Successfully updated ${updatedCount} dispensary batches with organization_id.`);
}
run();
