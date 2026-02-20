const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(
  envConfig.VITE_SUPABASE_URL || envConfig.REACT_APP_SUPABASE_URL,
  envConfig.VITE_SUPABASE_ANON_KEY || envConfig.REACT_APP_SUPABASE_ANON_KEY
);

async function check() {
    console.log("Fetching all clones rooms IDs");
    const { data: rooms } = await supabase.from('rooms').select('id, type');
    const allCloneRoomIds = rooms.filter(r => ['clones', 'esquejes', 'esquejera'].includes(r.type?.toLowerCase() || '')).map(r => r.id);

    console.log("Fetching active batches");
    const { data: batches } = await supabase
        .from('batches')
        .select('id, name, stage, current_room_id, parent_batch_id, clone_map_id, quantity, start_date, created_at')
        .is('discarded_at', null);

    const cloneRoomTypes = ['clones', 'esquejes', 'esquejera'];
    
    const allClones = batches.filter(b => {
        const room = rooms.find(r => r.id === b.current_room_id);
        return (room && cloneRoomTypes.includes(room.type?.toLowerCase() || '')) ||
            (b.current_room_id && allCloneRoomIds.includes(b.current_room_id)) ||
            b.parent_batch_id ||
            (b.name && b.name.startsWith('CL-')) ||
            (b.stage === 'seedling') ||
            /^[A-Z]+-\d+$/.test(b.name) ||
            b.clone_map_id !== null;
    });

    console.log(`Initial Filtered Clones: ${allClones.length}`);

    // Mimic exactly Clones.tsx logic
    const batchMap = new Map();
    allClones.forEach(b => batchMap.set(b.id, { ...b, children: [] }));

    const roots = [];
    const orphans = [];

    allClones.forEach(b => {
        if (b.parent_batch_id && batchMap.has(b.parent_batch_id)) {
            batchMap.get(b.parent_batch_id).children.push(batchMap.get(b.id)); 
            // Wait, Clones.tsx does: batchMap.get(b.parent_batch_id).children.push(b);
        } else {
            if (b.parent_batch_id) orphans.push(batchMap.get(b.id)); // Clones.tsx does orphans.push(b)
            else roots.push(batchMap.get(b.id));
        }
    });

    const groups = [];
    roots.forEach(root => {
        groups.push({ root, children: root.children });
    });
    orphans.forEach(o => groups.push({ root: o, children: [] }));

    console.log(`Groups length: ${groups.length}`);
    
    // Check total quantities
    let totalGroupsQty = 0;
    groups.forEach(g => {
        totalGroupsQty += Number(g.root.quantity || 0);
        g.children.forEach(c => totalGroupsQty += Number(c.quantity || 0));
    });
    console.log(`Total Qty derived from Groups: ${totalGroupsQty}`);

    // Let's examine a specific group of babies from PRUEBA 19/2/2026
    const prubaBaby = allClones.find(b => b.name === 'PRU-001' || b.name.includes('PRU'));
    if (prubaBaby) {
         console.log("\nFound PRU baby:", prubaBaby);
         console.log("Is it an orphan?:", orphans.some(o => o.id === prubaBaby.id));
         console.log("Is it a root?:", roots.some(r => r.id === prubaBaby.id));
         const parent = batchMap.get(prubaBaby.parent_batch_id);
         console.log("Does the parent exist in batchMap?:", !!parent);
         if (parent) {
             console.log("Parent in batchMap:", parent);
         }
    } else {
         console.log("\nNo PRU- related clones found!");
         // list all names
         console.log(allClones.map(c => c.name).slice(0, 10));
    }
}
check();
