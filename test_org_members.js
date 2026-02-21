require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

const supabase = createClient(supabaseUrl, serviceKey);

async function testFetch() {
    console.log("Testing getting an organization first...");
    const { data: orgs, error: orgErr } = await supabase.from('organizations').select('id').limit(1);

    if (orgErr || !orgs || orgs.length === 0) {
        console.log("Could not find any orgs", orgErr);
        return;
    }

    const orgId = orgs[0].id;
    console.log("Testing getOrganizationMembers for org:", orgId);

    const { data, error } = await supabase
        .from('organization_members')
        .select(`
            id,
            role,
            created_at,
            user_id,
            profile:profiles(
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('organization_id', orgId);

    if (error) {
        console.error("Query Error:", error.message, error.details, error.hint);
    } else {
        console.log("Query Success, rows found:", data.length);
        if (data.length > 0) {
            console.log(data[0]);
        }
    }
}

testFetch();
