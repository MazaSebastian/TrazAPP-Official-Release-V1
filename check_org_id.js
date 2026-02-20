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
        .select('id, name, organization_id')
        .limit(10);
    console.log("Sample batches:", batches);
}
run();
