const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
    // We'll use a raw query if possible, or just insert a dummy and see the error
    const { error: hLogError } = await supabase
        .from('chakra_harvest_logs')
        .insert([{
            batch_id: '123e4567-e89b-12d3-a456-426614174000',
            yield_amount: 1,
            organization_id: '123e4567-e89b-12d3-a456-426614174000'
        }]);
    console.log("Insert Test Result:", hLogError?.message || "Success");
}
run();
