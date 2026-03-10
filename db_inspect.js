const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
    console.log("Fetching all user tables from the active Supabase instance...");
    // We can't query information_schema directly with the JS client easily,
    // but maybe we can just query some common names and see what succeeds or fails.
    const tablesToTry = ['tasks', 'batch_tasks', 'notas', 'stickies', 'batch_stickies', 'chakra_tasks', 'lot_tasks'];
    
    for (const table of tablesToTry) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
            console.log(`❌ Table '${table}': ${error.message}`);
        } else {
            console.log(`✅ Table '${table}' exists!`);
        }
    }
}
run();
