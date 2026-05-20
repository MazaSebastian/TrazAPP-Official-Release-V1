const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const functionUrl = `${supabaseUrl}/functions/v1/process-patient-onboarding`;

async function test() {
  console.log("Calling", functionUrl);
  const res = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'apply',
      organizationId: 'trazapp-club-id', // dummy
      email: 'djsebamaza+1000@gmail.com', // Using a unique email
      password: 'password123',
      patientData: {
        fullName: 'Test User',
        documentNumber: '12345678',
        phone: '1122334455',
        reprocannStatus: 'none'
      },
      signatureBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
    })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}
test();
