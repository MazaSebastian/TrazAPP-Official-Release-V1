
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRLS() {
    console.log('Verifying RLS Implementation...');

    // 1. Check get_my_org_ids function existence
    const { error: funcError } = await supabase.rpc('get_my_org_ids');

    if (funcError) {
        // If it returns "setof uuid", it might still throw an error if called without auth context or returns empty, 
        // but usually if function doesn't exist it says "function not found"
        if (funcError.message.includes('function') && funcError.message.includes('does not exist')) {
            console.log('❌ Function "get_my_org_ids" does NOT exist.');
        } else {
            console.log(`✅ Function "get_my_org_ids" exists (Call result: ${funcError.message}).`);
        }
    } else {
        console.log('✅ Function "get_my_org_ids" exists and returned data.');
    }

    // 2. Check if Rooms has RLS enabled
    // We can't easily check internal pg tables via API without running a query, 
    // but we can try to Select. If RLS is on, and we are anon, we should get 0 rows (unless we have a public policy).
    // In `setup_rls_policies.sql`, we removed "Enable all access for now" for business tables.

    const { data, error, count } = await supabase.from('rooms').select('*', { count: 'exact', head: true });

    // We expect success but 0 rows if we are not logged in and RLS is working (and no public policy exists)
    // Or maybe error if we lost access completely.

    if (error) {
        console.log('⚠️ Error querying rooms:', error.message);
    } else {
        console.log(`ℹ️ Rooms visible to Anon: ${count}`);
        if (count === 0) {
            console.log('✅ RLS seems to be working (Anon sees 0 rooms).');
        } else {
            console.log('⚠️ Warning: Anon user can still see rooms. RLS might not be enabled or a public policy exists.');
        }
    }

}

verifyRLS();
