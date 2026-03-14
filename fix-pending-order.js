const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envLocal = fs.existsSync('.env.local') ? dotenv.parse(fs.readFileSync('.env.local')) : {};
const env = fs.existsSync('.env') ? dotenv.parse(fs.readFileSync('.env')) : {};

const url = envLocal.REACT_APP_SUPABASE_URL || env.REACT_APP_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
let key = envLocal.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error('FAILED TO FIND KEYS in .env files.');
    process.exit(1);
}

const supabase = createClient(url, key);

async function fixOrder() {
    console.log('--- ATTEMPTING TO CANCEL PENDING ORDERS ---');
    const { data, error } = await supabase
        .from('insumo_purchase_orders')
        .update({ status: 'CANCELLED' })
        .eq('status', 'PENDING')
        .select();
        
    if (error) {
        console.error('Error updating order:', error);
    } else {
        console.log(`Successfully cancelled ${data.length} pending orders.`);
        console.log(data);
    }
}
fixOrder();
