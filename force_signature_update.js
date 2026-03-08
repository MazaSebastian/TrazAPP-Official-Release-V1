import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY check your .env");
    process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkProfileUpdate() {
    console.log("Testing user profile update capacity for professional_signature_url...");

    const testUserId = '0dd3b084-9a4d-4f2e-8e16-73d809ef5047'; // user ID from the screenshot
    const testUrl = 'https://fnzxjpynuijjxxpcpgtd.supabase.co/storage/v1/object/public/signatures/0dd3b084-9a4d-4f2e-8e16-73d809ef5047_signature_1772933578798.png';

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ professional_signature_url: testUrl })
        .eq('id', testUserId)
        .select();

    if (error) {
        console.error("❌ Admin Update Failed:", error.message);
    } else {
        console.log("✅ Admin Update Success. We bypassed RLS to fix your specific user row.", data);
    }
}

checkProfileUpdate();
