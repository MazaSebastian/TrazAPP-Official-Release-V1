const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
    const { data: bData } = await supabase.from('chakra_harvest_logs').select('*').limit(1);
    console.log("Empty object keys just in case it returns something:");
    console.log(bData);

    // Actually we can just trigger an error with a wrong column and it will tell us
    // Or we can use the rpc if there is one. 
    // Wait, let's just do a POST to REST API using fetch directly to get the OpenAPI schema
    const res = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/?apikey=${process.env.REACT_APP_SUPABASE_ANON_KEY}`);
    const swagger = await res.json();
    const columns = swagger.definitions.chakra_harvest_logs.properties;
    console.log("Real Columns:", Object.keys(columns));
}
run();
