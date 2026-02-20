require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function checkTable(tableName) {
  const { error } = await supabase.from(tableName).select('organization_id').limit(1);
  if (error && error.code === 'PGRST204') {
    console.log(`❌ ${tableName} is MISSING organization_id`);
  } else if (!error || error.code !== 'PGRST204') {
    console.log(`✅ ${tableName} HAS organization_id (or other error: ${error?.message})`);
  }
}

async function run() {
  const tables = [
    'profiles', 'organizations', 'organization_members', 'rooms', 'batches', 
    'batch_movements', 'genetics', 'clone_maps', 'incidents', 'chakra_tasks', 
    'chakra_stickies', 'expenses', 'extractions', 'inventory_items', 
    'patients', 'prescriptions', 'dispensary_sales', 'daily_logs'
  ];
  for (const t of tables) {
    await checkTable(t);
  }
}
run();
