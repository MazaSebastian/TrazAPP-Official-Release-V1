const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL || envConfig.REACT_APP_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || envConfig.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Looking for ALL batches created today with name starting with PRU...");
    const { data: newBatches } = await supabase
        .from('batches')
        .select('*')
        .contains('name', 'PRU')
        .limit(20);
        
    console.log("Actually wait... the tracking code gives them a new name based on genetics nomenclature.");
    const { data: recentCreated } = await supabase
        .from('batches')
        .select('id, name, stage, quantity, current_room_id, parent_batch_id, clone_map_id, discarded_at')
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    console.log("Total recent batches created in last 24h:", recentCreated.length);
    
    // Find PRU's parent batch ID
    const { data: pruBatches } = await supabase
        .from('batches')
        .select('id, parent_batch_id')
        .ilike('name', '%PRU%')
        .order('created_at', { ascending: false })
        .limit(1);
        
    if (pruBatches.length > 0) {
        const sourceId = pruBatches[0].id;
        console.log("Finding children of PRU batch", sourceId);
        const { data: children1 } = await supabase
            .from('batches')
            .select('*')
            .eq('parent_batch_id', sourceId);
        console.log(`Direct Children of PRU (${sourceId}):`, children1.length);
        
        if (pruBatches[0].parent_batch_id) {
            const originalSourceId = pruBatches[0].parent_batch_id;
            console.log("Finding children of PRU parent's batch", originalSourceId);
             const { data: children2 } = await supabase
                .from('batches')
                .select('*')
                .eq('parent_batch_id', originalSourceId);
            console.log(`Children of PRU parent (${originalSourceId}):`, children2.length);
            if(children2.length > 0) console.log(children2[0]);
        }
    }
}
check();
