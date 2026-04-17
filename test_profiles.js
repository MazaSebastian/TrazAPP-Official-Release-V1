import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function test() {
    const { data: profiles, error } = await supabase.from('profiles').select('*').ilike('full_name', '%jemplo%');
    console.log("Error:", error);
    console.log("Data:", JSON.stringify(profiles, null, 2));
}
test();
