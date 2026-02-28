import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envFile.match(/REACT_APP_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/REACT_APP_SUPABASE_ANON_KEY=(.*)/)[1].trim();
// Trying to read VITE_SUPABASE_SERVICE_ROLE_KEY or similar from .env.local if present
let serviceKey = supabaseKey;
try {
    const localEnv = fs.readFileSync('.env.local', 'utf-8');
    const match = localEnv.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
    if (match) serviceKey = match[1].trim();
} catch (e) { }

const supabase = createClient(supabaseUrl, serviceKey);

async function checkData() {
    const email = 'djsebamaza@gmail.com';
    console.log('Checking DB for:', email);

    // 1. Get user profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();
    console.log('Profile:', profile?.id, profile?.role);

    // 2. Get organization where this user is owner
    const { data: orgs } = await supabase.from('organizations').select('*').eq('owner_email', email);
    console.log('Organizations owned by user:', orgs?.map(o => ({ id: o.id, status: o.status })));

    if (orgs && orgs.length > 0) {
        const orgId = orgs[0].id;
        // 3. Get members using service key
        const { data: members, error } = await supabase.from('organization_members').select('*').eq('organization_id', orgId);
        console.log(`Members in org ${orgId} (Service Key):`, members?.length, error);

        // 4. Also check with the anon key as if it was the frontend
        const anonSupabase = createClient(supabaseUrl, supabaseKey);
        // Authenticate the anon client as the user
        // First we need to login or we can't test RLS easily without password.
        // Instead we can just try to read with anon key (no user logged in), which should be blocked.
    }
}

checkData().then(() => process.exit(0)).catch(console.error);
