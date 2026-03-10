import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manually parse .env files to bypass dotenv Vite quirks
function getEnvVar(key) {
    for (const file of ['.env.local', '.env']) {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf-8');
            const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
            if (match) return match[1].trim().replace(/^['"]|['"]$/g, '');
        }
    }
    return null;
}

const supabaseUrl = getEnvVar('REACT_APP_SUPABASE_URL');
const supabaseServiceKey = getEnvVar('REACT_APP_SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('REACT_APP_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials.");
    console.log("URL:", supabaseUrl, "KEY:", !!supabaseServiceKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("Inserting trazapp plan...");

    const trazappPlan = {
        name: 'Plan TRAZAPP',
        slug: 'trazapp',
        features: ["IA Growy", "Gestión ONG", "ILimitado"],
        price: 0,
        limits: { max_users: 10, max_crops: 8, max_storage_gb: 5 },
        active: true
    };

    const { data, error } = await supabase
        .from('plans')
        .upsert(trazappPlan, { onConflict: 'slug' });

    if (error) {
        console.error("Error inserting plan:", error);
    } else {
        console.log("Success! Plan inserted/updated.");
    }
}

run();
