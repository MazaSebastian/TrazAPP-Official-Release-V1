const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL || envConfig.REACT_APP_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || envConfig.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMapClones() {
    console.log("Checking for babies recently added to a map...");
    const { data: batches, error } = await supabase
        .from('batches')
        .select('*')
        .not('clone_map_id', 'is', null)
        .is('discarded_at', null);

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${batches.length} active batches assigned to a clone map.`);
    if (batches.length > 0) {
        console.log("Sample:", batches[0]);
    }

    // See how many batches in total are active in the clones room
    const { data: clonesRoom } = await supabase.from('rooms').select('id, name, type').eq('type', 'clones');
    const cloneRoomIds = clonesRoom.map(r => r.id);

    const { data: activeClones } = await supabase
        .from('batches')
        .select('id, name, stage, current_room_id, clone_map_id, quantity')
        .in('current_room_id', cloneRoomIds)
        .is('discarded_at', null);

    console.log(`\nTotal Active Batches inside 'clones' rooms: ${activeClones?.length}`);
    if (activeClones && activeClones.length > 0) {
        console.log(activeClones.slice(0, 3));
        // Print quantities sum
        const totalQty = activeClones.reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
        console.log(`Total Quantity of all active clones in these rooms: ${totalQty}`);
    }
}

checkMapClones();
