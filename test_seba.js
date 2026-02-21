require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function checkSeba() {
    const userId = 'cf5f6945-ff91-4ec4-ac0f-7651aca3e898';

    // Check with anon key (frontend simulation)
    const { data: members, error: membersErr } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', userId);

    console.log("Anon check members:", members);
    console.log("Anon check error:", membersErr);

    // If RLS blocked it, check with service key
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
        const adminSupabase = createClient(process.env.REACT_APP_SUPABASE_URL, serviceKey);
        const { data: adminMembers, error: adminErr } = await adminSupabase
            .from('organization_members')
            .select('*')
            .eq('user_id', userId);

        console.log("Admin check members:", adminMembers);
        console.log("Admin check error:", adminErr);

        if (adminMembers && adminMembers.length > 0) {
            console.log("Admin org IDs:", adminMembers.map(m => m.organization_id));

            // Check if those orgs exist
            for (const m of adminMembers) {
                const { data: org, error: orgErr } = await adminSupabase
                    .from('organizations')
                    .select('*')
                    .eq('id', m.organization_id);
                console.log(`Org ${m.organization_id}:`, org, orgErr);

                // Check if the anon key CAN READ the org
                const { data: anonOrg, error: anonOrgErr } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', m.organization_id);
                console.log(`Anon Org ${m.organization_id}:`, anonOrg, anonOrgErr);
            }
        }
    }
}

checkSeba();
