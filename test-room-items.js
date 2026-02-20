const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL || envConfig.REACT_APP_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || envConfig.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const roomId = '0fe06e16-1048-44cf-80df-47a35a098db7';
    console.log("Fetching batches for room:", roomId);
    
    // Check Room type!
    const { data: roomInfo } = await supabase.from('rooms').select('id, name, type').eq('id', roomId).single();
    console.log("Room info:", roomInfo);
    
    const { data: activeBatches } = await supabase
        .from('batches')
        .select('*')
        .eq('current_room_id', roomId)
        .is('discarded_at', null);

    console.log("Active batches precisely in this array:", activeBatches.length);
    if(activeBatches.length > 0) {
        console.log("Sample active batch:", activeBatches[0]);
    }
}
run();
