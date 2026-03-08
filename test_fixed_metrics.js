import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or Key");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkData() {
    console.log("Checking DB for test data...");

    // Check organizations
    const { data: orgs } = await supabase.from('organizations').select('id, name').limit(1);
    if (!orgs || orgs.length === 0) {
        console.log("No organizations found, cannot test properly.");
        return;
    }
    const orgId = orgs[0].id;
    console.log(`Using Org ID: ${orgId} (${orgs[0].name})`);

    // Check Metrics directly
    console.log("\n--- Testing RPC: get_monthly_metrics ---");
    const { data: m1, error: e1 } = await supabase.rpc('get_monthly_metrics', { query_year: 2026, org_id: orgId });
    if (e1) console.error(e1); else console.log(m1);

    console.log("\n--- Testing RPC: get_genetic_performance ---");
    const { data: m2, error: e2 } = await supabase.rpc('get_genetic_performance', { org_id: orgId });
    if (e2) console.error(e2); else console.log(m2);

    console.log("\n--- Testing RPC: get_cost_breakdown ---");
    const { data: m3, error: e3 } = await supabase.rpc('get_cost_breakdown', { start_date: '2026-01-01', end_date: '2026-12-31', org_id: orgId });
    if (e3) console.error(e3); else console.log(m3);
}

checkData();
