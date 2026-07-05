const fetch = require('node-fetch'); // wait, node-fetch might not be installed, we can use built-in fetch if node version is >= 18.
// Node v18+ has global fetch. Let's just use global fetch.

async function test() {
  console.log("Sending POST to production API...");
  try {
    const res = await fetch("https://software.trazapp.ar/api/link-device", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    console.log("Status:", res.status);
    const body = await res.json();
    console.log("Body:", body);
  } catch (err) {
    console.error("Fetch err:", err);
  }
}

test();
