const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL || envConfig.REACT_APP_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || envConfig.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: rooms, error: roomsErr } = await supabase.from('rooms').select('id, name, type');
    if (roomsErr) {
        console.error("Rooms err:", roomsErr);
        return;
    }

    const { data: batches, error: batchErr } = await supabase.from('batches').select('id, name, stage, current_room_id, parent_batch_id, clone_map_id, discarded_at').is('discarded_at', null);
    if (batchErr) {
        console.error("Batches err:", batchErr);
        return;
    }

    let missing = 0;
    const cloneRoomTypes = ['clones', 'esquejes', 'esquejera'];
    const allCloneRoomIds = rooms.filter(r => cloneRoomTypes.includes(r.type?.toLowerCase() || '')).map(r => r.id);

    const allClones = batches.filter(b => {
        const room = rooms.find(r => r.id === b.current_room_id);
        const match = (room && cloneRoomTypes.includes(room.type?.toLowerCase() || '')) ||
            (b.current_room_id && allCloneRoomIds.includes(b.current_room_id)) ||
            b.parent_batch_id ||
            (b.name && b.name.startsWith('CL-')) ||
            (b.stage === 'seedling') ||
            /^[A-Z]+-\d+$/.test(b.name) ||
            b.clone_map_id !== null;

        if (!match) {
            // is it a clone?
            if (b.name && b.name.includes('-')) {
                missing++;
            }
        }
        return match;
    });

    console.log("Total active batches:", batches.length);
    console.log("Filtered active clones length:", allClones.length);
    console.log("Missing potential clones:", missing);
    console.log("Rooms considered clone rooms:", rooms.filter(r => cloneRoomTypes.includes(r.type?.toLowerCase() || '')));

    // Display some batches that match our "loose" clone definition but aren't filtered
    const missingBatches = batches.filter(b => !allClones.includes(b) && b.name && b.name.includes('-'));
    console.log("Some missing batches:", missingBatches.slice(0, 5));
}

check();
