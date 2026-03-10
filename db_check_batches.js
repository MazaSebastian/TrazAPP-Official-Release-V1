const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
    const { data: bData } = await supabase.from('batches').select('id, name, quantity, stage, parent_batch_id, discarded_at, discard_reason');
    if (bData) {
        console.log(`Found ${bData.length} batches.`);
        console.log(bData);
    }
}
run();
