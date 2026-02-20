
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars. Ensure .env file exists and contains REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying Schema via Supabase Client...');

    const tablesToCheck = ['rooms', 'batches', 'chakra_crops', 'profiles', 'tasks', 'insumos'];
    const results = {};

    for (const table of tablesToCheck) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            // If error code is '42P01' it means table doesn't exist (usually), but simpler to just check error
            // Actually RLS might return error if no policy, but we set up policies.
            // If table doesn't exist, we usually get a specific error.
            results[table] = `Error: ${error.message}`;
        } else {
            results[table] = 'OK (Table exists)';
        }
    }

    console.table(results);
}

verify();
