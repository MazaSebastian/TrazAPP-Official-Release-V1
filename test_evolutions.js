require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
(async () => {
    const { data, error } = await supabase.from('clinical_evolutions').select('id, eva_score, improvement_percent, created_at, notes, template_data').order('created_at', { ascending: false }).limit(3);
    console.log(JSON.stringify({ data, error }, null, 2));
})();
