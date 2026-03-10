const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
    const { data: bData } = await supabase.from('batches').select('id, name, organization_id').limit(1);
    if (bData && bData.length > 0) {
        console.log("Columns in batches:", Object.keys(bData[0]));
    }
}
run();
