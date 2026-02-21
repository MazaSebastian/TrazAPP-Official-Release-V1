require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

async function testFetchWithAnonKey() {
    console.log("Invoking edge function with anon key directly via fetch...");
    const res = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`
        },
        body: JSON.stringify({
            email: 'test_anon' + Date.now() + '@example.com',
            password: 'password123',
            name: 'Test Setup Anon',
            role: 'grower',
            organizationId: 'e6c77b09-d43a-4180-b9be-7b0a1702c157'
        })
    });

    console.log("Status:", res.status);
    console.log("Response Body:", await res.text());
}

testFetchWithAnonKey();
