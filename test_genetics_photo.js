require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
async function test() {
    const { data, error } = await supabase.from('genetics').select('photo_url').limit(1);
    if (error) {
        console.log("Error or column doesn't exist:", error.message);
    } else {
        console.log("Column exists:", data);
    }
}
test();
