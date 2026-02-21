require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // 1. Fetch current plan
    console.log("Fetching ONG plan...");
    const { data: getPlan, error: getErr } = await supabase.from('plans').select('*').ilike('slug', 'ong');
    if (getErr) {
        console.error("Error fetching plan:", getErr);
        return;
    }

    console.log("Current Plan:", getPlan);

    if (getPlan && getPlan.length > 0) {
        const p = getPlan[0];
        const newLimits = { ...p.limits, max_users: 10 };
        console.log("Updating to new limits:", newLimits);

        const { data, error } = await supabase.from('plans')
            .update({ limits: newLimits })
            .eq('id', p.id);

        console.log("Update result:", error ? error : "Success!");
    } else {
        console.log("ONG plan not found in database.");
    }
}

run();
