const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL || envConfig.REACT_APP_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || envConfig.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching batches with null organization_id...");
    const { data: batches, error } = await supabase
        .from('batches')
        .select('id, name, organization_id, parent_batch_id')
        .is('organization_id', null);

    if (error) {
        console.error("Error fetching batches:", error);
        return;
    }

    console.log(`Found ${batches.length} batches with null organization_id.`);

    if (batches.length === 0) return;

    let updatedCount = 0;

    // Fetch all parent_ids to not query one by one if possible
    const parentIds = [...new Set(batches.map(b => b.parent_batch_id).filter(Boolean))];
    console.log(`Need to resolve ${parentIds.length} unique parent IDs for their organzation...`);

    const { data: parents, error: pError } = await supabase
        .from('batches')
        .select('id, organization_id')
        .in('id', parentIds);

    if (pError) {
        console.error("Error fetching parents:", pError);
        return;
    }

    const parentOrgMap = new Map();
    parents.forEach(p => {
        if (p.organization_id) {
            parentOrgMap.set(p.id, p.organization_id);
        }
    });

    for (const batch of batches) {
        if (batch.parent_batch_id && parentOrgMap.has(batch.parent_batch_id)) {
            const orgId = parentOrgMap.get(batch.parent_batch_id);
            const { error: updErr } = await supabase
                .from('batches')
                .update({ organization_id: orgId })
                .eq('id', batch.id);

            if (updErr) {
                console.error(`Error updating batch ${batch.id}:`, updErr);
            } else {
                updatedCount++;
            }
        } else {
            // Let's try to derive organization by traversing further up or looking at room?
            // Not strictly needed in this fix, we mainly care about children of known parents.
        }
    }

    console.log(`Successfully updated ${updatedCount} batches with their parent's organization_id.`);
}
run();
