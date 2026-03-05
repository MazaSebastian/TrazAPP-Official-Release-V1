import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    const { data, error } = await supabase
        .from('rooms')
        .select(`
        id,
        name,
        type,
        active_batches:batches(
            id,
            count,
            start_date,
            genetic:genetics(name)
        )
    `)
        .limit(5);

    if (error) {
        console.error("Error querying:", error);
    } else {
        console.log("Success! Data:", JSON.stringify(data, null, 2));
    }
}
testQuery();
