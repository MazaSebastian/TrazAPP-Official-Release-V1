const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL || envConfig.REACT_APP_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY || envConfig.REACT_APP_SUPABASE_ANON_KEY);

async function check() {
    const { data: rooms } = await supabase.from('rooms').select('id, name, type');
    console.log("Rooms:", rooms);
    
    const { data: batches } = await supabase.from('batches').select('id, name, stage, current_room_id, parent_batch_id, discarded_at').is('discarded_at', null);
    
    let missing = 0;
    
    // mimic filter
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
    
    console.log("Total batches:", batches.length);
    console.log("Filtered active clones length:", allClones.length);
    console.log("Missing potential clones:", missing);
    console.log("Rooms considered clone rooms:", rooms.filter(r => cloneRoomTypes.includes(r.type?.toLowerCase() || '')));
}
check();
