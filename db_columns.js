const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
    console.log("Fetching a task to inspect its columns...");
    const { data, error } = await supabase.from('chakra_tasks').select('*').limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        if (data && data.length > 0) {
            console.log("Columns in chakra_tasks:", Object.keys(data[0]));
        } else {
            console.log("chakra_tasks is empty. Trying to trigger an error to see schema, or just assuming 'entity_id' or 'room_id'...");
        }
    }
}
run();
