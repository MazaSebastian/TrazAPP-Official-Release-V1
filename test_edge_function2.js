const url = "https://fnzxjpynuijjxxpcpqtd.supabase.co/functions/v1/send-invite";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuenhqcHludWlqanh4cGNwcXRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDc3MzYsImV4cCI6MjA4NzAyMzczNn0.1qgAvml5ATk6Hk_CfHTG7w97fIYgL_SXwxxrffM-tf4";

async function test() {
    console.log("Testing Edge Function with unverified email...");
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${anonKey}`
            },
            body: JSON.stringify({
                email: "random.user12398@gmail.com",
                inviteLink: "https://software.trazapp.ar/register?token=test",
                orgName: "Test Org"
            })
        });

        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

test();
