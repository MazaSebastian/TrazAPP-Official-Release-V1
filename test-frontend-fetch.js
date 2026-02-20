const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL || envConfig.REACT_APP_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || envConfig.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching what frontend fetches...");
    const { data: batches } = await supabase
        .from('batches')
        .select('*, room:rooms(id, name, type), genetic:genetics(name, type)')
        //.eq('organization_id', getSelectedOrgId())
        .is('discarded_at', null)
        .order('created_at', { ascending: false });

    console.log("Batches:", batches.length);
    const { data: allRooms } = await supabase.from('rooms').select('id, name, type');
    
    const cloneRoomTypes = ['clones', 'esquejes', 'esquejera'];
    const allCloneRoomIds = allRooms.filter(r => cloneRoomTypes.includes(r.type?.toLowerCase() || '')).map(r => r.id);
    
    // Exact frontend filter
    const allClones = batches.filter(b =>
        (b.room && cloneRoomTypes.includes(b.room.type?.toLowerCase() || '')) ||
        (b.current_room_id && allCloneRoomIds.includes(b.current_room_id)) ||
        b.parent_batch_id ||
        (b.name && b.name.startsWith('CL-')) ||
        (b.stage === 'seedling') ||
        b.clone_map_id !== null ||
        /^[A-Z]+-\d+$/.test(b.name) ||
        /^[A-Z]+ - .+$/.test(b.name)
    );

    console.log("Frontend Filter Output:", allClones.length);
    let totalQty = 0;
    allClones.forEach(b => totalQty += (Number(b.quantity) || 0));
    console.log("Total Qty calculated:", totalQty);
}
run();
