const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
    const orgId = "1a8b9821-2e65-4f7f-8c31-cdef545ccee1";
    // Get a batch and a profile
    const { data: batches } = await supabase.from('chakra_dispensary_batches').select('id').eq('organization_id', orgId).limit(1);
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);

    if (batches && batches.length > 0 && profiles && profiles.length > 0) {
        const batchId = batches[0].id;
        const profileId = profiles[0].id;

        const { data, error } = await supabase.from('chakra_dispensary_movements').insert([{
            batch_id: batchId,
            member_id: profileId,
            type: 'dispense',
            amount: -100,
            reason: 'Entrega de Prueba Juan Perez',
            previous_weight: 500,
            new_weight: 400
        }]).select();

        console.log("Insert result:", data, error);
    } else {
        console.log("No batches or profiles found to test with.");
    }
}
run();
