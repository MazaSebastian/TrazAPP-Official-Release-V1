require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function testRLS() {
    const email = 'trazappadmin@admin.com';
    const password = 'Seba4794!';

    // Log in to get the JWT
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authErr) {
        console.error("Login err:", authErr);
        return;
    }

    const userId = authData.user.id;
    console.log("Logged in as:", userId);

    // Now check organization_members WITH the authenticated client
    const { data: members, error: membersErr } = await supabase
        .from('organization_members')
        .select(`
            role,
            organization:organizations (*)
        `)
        .eq('user_id', userId);

    console.log("Member rows returned:", members ? members.length : 0);
    console.log("Members data:", JSON.stringify(members, null, 2));
    if (membersErr) {
        console.error("Member query err:", membersErr);
    }
}

testRLS();
