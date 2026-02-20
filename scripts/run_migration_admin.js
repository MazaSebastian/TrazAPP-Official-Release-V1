require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
// MUST USE SERVICE ROLE KEY FOR MIGRATIONS TO BYPASS RLS AND ADMIN TASKS
// IF NO SERVICE ROLE KEY, WE TRY WITH ANON KEY BUT MIGHT FAIL FOR SOME OPS
// For this environment, we likely only have ANON key available in .env
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const sqlFilePath = path.join(__dirname, '../update_organizations_status.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Running migration...');

    // Split by semicolon? No, supabase.rpc or specific PG driver needed usually.
    // supersbase-js doesn't support raw SQL execution easily without a stored procedure.
    // We need to check if there is a 'exec_sql' RPC function or similar.
    // Standard workaround for client-side migration:

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });

    if (error) {
        console.error('Migration Failed:', error);
        // Fallback: If exec_sql doesn't exist, we might need to instruct user to run it in SQL Editor.
        console.log('NOTE: If this failed due to missing function "exec_sql", please run the SQL manually in Supabase Dashboard.');
    } else {
        console.log('Migration Success:', data);
    }
}

// Special case: If we don't have exec_sql, we can't run DDL via client easily.
// Let's try to verify if columns exist first? No, let's just try RPC.

runMigration();
