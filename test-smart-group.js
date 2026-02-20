const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(
  envConfig.VITE_SUPABASE_URL || envConfig.REACT_APP_SUPABASE_URL,
  envConfig.VITE_SUPABASE_ANON_KEY || envConfig.REACT_APP_SUPABASE_ANON_KEY
);

async function run() {
    const { data: batches } = await supabase
        .from('batches')
        .select('*, room:rooms(name, type), genetic:genetics(name)')
        .is('discarded_at', null);
        
    const allClones = batches.filter(b => b.clone_map_id !== null); // Simplified to test just the babies
    
    const batchMap = new Map();
    allClones.forEach(b => batchMap.set(b.id, { ...b, children: [] }));

    const roots = [];
    const orphans = [];

    allClones.forEach(b => {
        if (b.parent_batch_id && batchMap.has(b.parent_batch_id)) {
            batchMap.get(b.parent_batch_id).children.push(batchMap.get(b.id)); // Using the mapped object! (Clones.tsx has a bug here: it pushes `b` not `batchMap.get(b.id)`)
        } else {
            if (b.parent_batch_id) orphans.push(batchMap.get(b.id)); 
            else roots.push(batchMap.get(b.id)); 
        }
    });

    const groups = [];
    roots.forEach(root => {
        groups.push({ root, children: root.children });
    });
    orphans.forEach(o => groups.push({ root: o, children: [] })); // wait... orphans have no children ?
    
    const smartGroups = [];
    const groupMap = new Map();

    groups.forEach(group => {
        const { root } = group;
        const dateKey = new Date(root.start_date || root.created_at).toLocaleDateString();
        const key = `${root.genetic_id || 'unk'}|${dateKey}|${root.room_id || root.current_room_id || 'unk'}`;

        if (!groupMap.has(key)) {
            groupMap.set(key, []);
        }
        groupMap.get(key).push(group);
    });

    groupMap.forEach((bundledGroups) => {
        if (bundledGroups.length === 1) {
            smartGroups.push(bundledGroups[0]);
        } else {
            bundledGroups.sort((a, b) => a.root.name.localeCompare(b.root.name));

            const primary = bundledGroups[0];
            const rest = bundledGroups.slice(1);

            const mergedChildren = [...primary.children];
            rest.forEach(g => {
                mergedChildren.push(g.root); 
                mergedChildren.push(...g.children); 
            });

            smartGroups.push({ root: primary.root, children: mergedChildren });
        }
    });
    
    // Total stats
    let t = 0;
    smartGroups.forEach(g => {
         t += g.root.quantity;
         g.children.forEach(c => t+=c.quantity);
         if (g.children.length > 5) {
             console.log("Large smart group:", g.root.name, "Total children:", g.children.length);
         }
    });
    console.log("Total qty via smartGroups:", t);
}
run();
