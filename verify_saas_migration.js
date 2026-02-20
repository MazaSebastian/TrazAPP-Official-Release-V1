
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
    console.log('Verifying SaaS Migration Phase 1...');

    // 1. Check organizations table
    const { error: orgError } = await supabase.from('organizations').select('count', { count: 'exact', head: true });
    if (orgError && orgError.code === '42P01') {
        console.log('❌ Table "organizations" does NOT exist.');
        return;
    } else if (orgError) {
        console.log('❌ Error checking organizations:', orgError.message);
    } else {
        console.log('✅ Table "organizations" exists.');
    }

    // 2. Check organization_members table
    const { error: memError } = await supabase.from('organization_members').select('count', { count: 'exact', head: true });
    if (memError && memError.code === '42P01') {
        console.log('❌ Table "organization_members" does NOT exist.');
    } else {
        console.log('✅ Table "organization_members" exists.');
    }

    // 2b. Check chakra_extractions table
    const { error: extError } = await supabase.from('chakra_extractions').select('count', { count: 'exact', head: true });
    if (extError && extError.code === '42P01') {
        console.log('❌ Table "chakra_extractions" does NOT exist.');
    } else {
        console.log('✅ Table "chakra_extractions" exists.');
    }

    // 3. Check organization_id column in rooms (by trying to select it)
    const { error: colError } = await supabase.from('rooms').select('organization_id').limit(1);
    if (colError) {
        console.log('❌ Column "organization_id" in "rooms" check failed:', colError.message);
    } else {
        console.log('✅ Column "organization_id" exists in "rooms".');
    }

    // 4. Check if backfill worked (at least one organization should exist if there were users)
    // Note: RLS might prevent reading if we are anon/not logged in as that user. 
    // But we set a temporary policy "Enable all access for now" in setup_organizations.sql, so we should see it.
    const { count: orgCount, error: countError } = await supabase.from('organizations').select('*', { count: 'exact', head: true });

    if (countError) {
        console.log('⚠️ Could not count organizations:', countError.message);
    } else {
        console.log(`ℹ️ Organizations found: ${orgCount}`);
        if (orgCount > 0) {
            console.log('✅ Data backfill seems to have run (organizations created).');
        } else {
            console.log('⚠️ No organizations found. Backfill might not have run or there were no users.');
        }
    }

}

verifyMigration();
