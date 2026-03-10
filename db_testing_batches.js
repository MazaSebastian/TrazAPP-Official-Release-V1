const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
    // We want to see batches created today
    const { data: bData } = await supabase.from('batches')
        .select('id, name, quantity, stage, parent_batch_id, discarded_at, discard_reason, created_at, genetics(name)')
        .gte('created_at', '2026-03-10T00:00:00Z');

    if (bData) {
        console.log(`Found ${bData.length} batches created today (2026-03-10).`);
        const testingBatches = bData.filter(b => {
            const gName = Array.isArray(b.genetics) ? b.genetics[0]?.name : b.genetics?.name;
            return gName && gName.toLowerCase().includes('testing');
        });
        console.log(`Of those, ${testingBatches.length} are of genetic 'testing'.`);
        let sum = 0;
        testingBatches.forEach(b => {
            console.log(`- Batch: ${b.name}, Qty: ${b.quantity}, Parent: ${b.parent_batch_id}, Discarded: ${b.discard_reason}`);
            sum += (b.quantity || 1);
        });
        console.log(`Total sum of quantity: ${sum}`);
    }
}
run();
