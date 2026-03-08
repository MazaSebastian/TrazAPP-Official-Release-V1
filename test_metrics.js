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

async function testMetricsRPCs() {
    console.log("Testing get_monthly_metrics...");
    const { data: m1, error: e1 } = await supabase.rpc('get_monthly_metrics', { query_year: 2026 });
    console.log("M1 Result:", e1 ? e1.message : (m1?.length || 0) + " rows");

    console.log("Testing get_genetic_performance...");
    const { data: m2, error: e2 } = await supabase.rpc('get_genetic_performance');
    console.log("M2 Result:", e2 ? e2.message : (m2?.length || 0) + " rows");

    console.log("Testing get_cost_breakdown...");
    const { data: m3, error: e3 } = await supabase.rpc('get_cost_breakdown', { start_date: '2026-01-01', end_date: '2026-12-31' });
    console.log("M3 Result:", e3 ? e3.message : (m3?.length || 0) + " rows");
}

testMetricsRPCs();
