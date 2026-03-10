const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
    // Send a totally malformed query to force Supabase to dump the schema in the error
    const { error: hLogError } = await supabase
        .from('chakra_harvest_logs')
        .select('give_me_your_columns')
        .limit(1);
    console.log("Schema Error Dump:", hLogError?.message || "Success");
}
run();
