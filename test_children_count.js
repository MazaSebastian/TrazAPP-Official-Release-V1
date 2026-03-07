import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    const { data, error } = await supabase
        .from('batches')
        .select('*, children:batches!parent_batch_id(id)')
        .eq('quantity', 0)
        .ilike('discard_reason', '%Distribuido%')
        .limit(5);

    if (error) {
        console.error('Error:', error.message);
    } else {
        data.forEach(b => {
            console.log(`[${b.tracking_code}] ${b.name}: Quantity 0. Children count: ${b.children?.length}`);
        });
    }
}
testFetch();
