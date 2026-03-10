const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
    console.log("Checking batch_movements...");
    const { data: bm } = await supabase.from('batch_movements').select('batch_id').limit(1);
    if (bm) console.log("batch_movements exists!");

    console.log("Checking if there are any batch references in chakra_tasks...");
    const { data: ct, error } = await supabase.from('chakra_tasks').select('batch_id').limit(1);
    if (error) console.log("chakra_tasks doesn't have batch_id:", error.message);
    else console.log("chakra_tasks has batch_id!");
}
run();
