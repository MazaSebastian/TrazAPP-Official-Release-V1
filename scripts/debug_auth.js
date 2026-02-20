require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Env Vars. Make sure .env is in the parent directory.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
    const email = 'trazappadmin@admin.com';
    // I don't have the password. The user provided credentials?
    // User said: "trazappadmin@admin.com", and screenshot shows "Seba4794!".
    // I will use that password.
    const password = 'Seba4794!';

    console.log(`Attempting login for ${email}...`);
    console.time('Login Duration');

    // Add a timeout to the script itself
    const timeout = setTimeout(() => {
        console.error('SCRIPT TIMEOUT: Login took longer than 15 seconds.');
        process.exit(1);
    }, 15000);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    clearTimeout(timeout);
    console.timeEnd('Login Duration');

    if (error) {
        console.error('Login Failed:', error.message);
        if (error.stack) console.error(error.stack);
    } else {
        console.log('Login Successful!');
        console.log('User ID:', data.user.id);
        console.log('User Role (Metadata):', data.user.user_metadata?.role);

        console.log('Fetching Profile...');
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            console.error('Profile Fetch Failed:', profileError.message);
        } else {
            console.log('Profile Found:', profile);
        }
    }
}

testLogin();
