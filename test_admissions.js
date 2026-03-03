require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
(async () => {
    const { data, error } = await supabase.from('clinical_admissions').select('id, patient_id, baseline_pain_avg');
    console.log(JSON.stringify({ data, error }, null, 2));
})();
