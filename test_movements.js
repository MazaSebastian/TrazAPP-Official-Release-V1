const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
    const orgId = "1a8b9821-2e65-4f7f-8c31-cdef545ccee1";

    const { data: noProfile, error: err1 } = await supabase
        .from('chakra_dispensary_movements')
        .select(`
            *,
            batch:batch_id!inner (
                batch_code,
                strain_name,
                organization_id
            )
        `)
        .eq('batch.organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5);

    console.log("Without Profile JOIN:", JSON.stringify(noProfile, null, 2));

    const { data: withProfile, error: err2 } = await supabase
        .from('chakra_dispensary_movements')
        .select(`
            *,
            batch:batch_id!inner (
                batch_code,
                strain_name,
                organization_id
            ),
            profile:member_id (
                full_name
            )
        `)
        .eq('batch.organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5);

    console.log("With Profile JOIN Error:", err2);
    console.log("With Profile JOIN:", JSON.stringify(withProfile, null, 2));
}

run();
