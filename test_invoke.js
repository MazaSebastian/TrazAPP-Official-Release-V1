require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

const supabaseAdmin = createClient(supabaseUrl, serviceKey);
const supabaseUser = createClient(supabaseUrl, anonKey);

async function testFullFlow() {
    console.log("1. Creating dummy user directly in auth for testing...");
    const dummyEmail = 'testhttp' + Date.now() + '@example.com';
    const dummyPassword = 'password123';

    const { data: adminData, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
        email: dummyEmail,
        password: dummyPassword,
        email_confirm: true
    });

    if (adminErr) {
        console.log("Could not create dummy user:", adminErr.message);
        return;
    }
    const userId = adminData.user.id;
    console.log("Created user:", userId);

    console.log("2. Signing in via standard client...");
    const { error: signInErr } = await supabaseUser.auth.signInWithPassword({
        email: dummyEmail,
        password: dummyPassword
    });

    if (signInErr) {
        console.log("Sign in error:", signInErr.message);
        return;
    }

    console.log("3. Invoking Edge Function...");
    const { data, error } = await supabaseUser.functions.invoke('create-user', {
        body: {
            email: 'target' + Date.now() + '@example.com',
            password: 'password123',
            name: 'Target User',
            role: 'grower',
            organizationId: 'e6c77b09-d43a-4180-b9be-7b0a1702c157'
        }
    });

    if (error) {
        console.error("Function Invocation ERROR details:", error);
        if (error.context) {
            console.error("Context Status:", error.context.status);
            try { console.error("Context Body:", await error.context.text()); } catch (e) { }
        }
    } else {
        console.log("Function Success Data:", data);
    }

    console.log("4. Cleaning up dummy user...");
    await supabaseAdmin.auth.admin.deleteUser(userId);
}

testFullFlow();
