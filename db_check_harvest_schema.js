const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
    // We can't query information_schema directly from JS client,
    // but we can do a dummy select and look at the keys
    const { data, error } = await supabase.from('chakra_harvest_logs').select('*').limit(1);
    if (error) console.log(error);
    else console.log(data);
}
run();
