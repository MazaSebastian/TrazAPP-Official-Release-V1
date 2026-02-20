const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL || envConfig.REACT_APP_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || envConfig.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: rooms } = await supabase.from('rooms').select('id, name, type');
    const { data: batches } = await supabase.from('batches').select('id, name, stage, current_room_id, parent_batch_id, clone_map_id, discarded_at').is('discarded_at', null);

    const cloneRoomTypes = ['clones', 'esquejes', 'esquejera'];
    const cloneRooms = rooms.filter(r => cloneRoomTypes.includes(r.type?.toLowerCase() || ''));
    const allCloneRoomIds = cloneRooms.map(r => r.id);
    
    // Check batches ACTUALLY in a clone room
    const batchesInCloneRooms = batches.filter(b => allCloneRoomIds.includes(b.current_room_id));
    
    console.log("Batches physically in clone rooms:", batchesInCloneRooms.length);
    
    // Simulate OLD logic
    const oldMatches = batchesInCloneRooms.filter(b => {
        const room = rooms.find(r => r.id === b.current_room_id);
        return (room && cloneRoomTypes.includes(room.type?.toLowerCase())) ||
            (b.current_room_id && allCloneRoomIds.includes(b.current_room_id)) ||
            b.parent_batch_id ||
            (b.name && b.name.startsWith('CL-')) ||
            (b.stage === 'seedling') ||
            /^[A-Z]{3}-\d{4}$/.test(b.name) ||
            /^[A-Z]{3}-\d{3}$/.test(b.name) ||
            b.clone_map_id !== null;
    });

    // Determine why OLD logic failed
    console.log("Batches matched by OLD logic:", oldMatches.length);
    
    if (batchesInCloneRooms.length !== oldMatches.length) {
         console.log("MISSING BATCHES in old logic:");
         console.log(batchesInCloneRooms.filter(b => !oldMatches.includes(b)));
    }
}
check();
