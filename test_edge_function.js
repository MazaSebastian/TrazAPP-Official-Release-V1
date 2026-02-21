require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

async function testEdgeFunction() {
    console.log("Authenticating as owner email...");
    // Let's just use the fetch API directly so we can see the exact HTTP response without the client throwing immediately!
    const res = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}` // valid jwt format, might get rejected by the internal role check but should pass kong
        },
        body: JSON.stringify({
            email: 'test' + Date.now() + '@example.com',
            password: 'password123',
            name: 'Test Setup',
            role: 'grower',
            organizationId: 'e6c77b09-d43a-4180-b9be-7b0a1702c157'
        })
    });

    console.log("Status:", res.status);
    console.log("Text:", await res.text());
}

testEdgeFunction();
