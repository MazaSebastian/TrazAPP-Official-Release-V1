const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase.from('batches').select('id, name, stage, current_room_id, room:rooms(name, type), parent_batch_id, clone_map_id');
    if (error) console.error(error);
    else {
        console.log("Total batches:", data.length);
        const clones = data.filter(b => 
            (b.room && ['clones', 'esquejes', 'esquejera'].includes(b.room.type?.toLowerCase())) ||
            ['clones', 'esquejes', 'esquejera'].includes(b.room?.type?.toLowerCase()) ||
            b.stage === 'seedling' || 
            (b.name && b.name.startsWith('CL-')) ||
            /^[A-Z]{1,5}-\d{3,4}$/.test(b.name) ||
            b.clone_map_id !== null
        );
        console.log("Filtered clones length:", clones.length);
        console.log("Missing batches that might be clones:");
        console.dir(data.filter(b => !clones.includes(b)).slice(0, 10), {depth: null});
    }
}
run();
