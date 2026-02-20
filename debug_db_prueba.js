const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL || envConfig.REACT_APP_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || envConfig.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Looking for ALL batches containing PRU...");
    const { data: pruBatches } = await supabase
        .from('batches')
        .select('id, name, stage, quantity, current_room_id, parent_batch_id, clone_map_id, discarded_at')
        .ilike('name', '%PRU%')
        .order('created_at', { ascending: false })
        .limit(20);
        
    console.log("Recent PRU batches found:", pruBatches.length);
    console.dir(pruBatches, {depth: null});
}
check();
