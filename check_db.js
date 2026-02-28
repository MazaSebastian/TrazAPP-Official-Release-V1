import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envFile.match(/REACT_APP_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/REACT_APP_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- TEST 1: Get Organizations for sebbi77ax68@gmail.com ---');
  let orgs = await supabase.from('organizations').select('*').eq('owner_email', 'sebbi77ax68@gmail.com');
  console.log(orgs.data);

  if (orgs.data && orgs.data[0]) {
    console.log(`\n--- TEST 2: Get Organization Members for org ${orgs.data[0].id} ---`);
    let members = await supabase.from('organization_members').select('*').eq('organization_id', orgs.data[0].id);
    console.log(members.data);

    if (members.data && members.data[0]) {
      console.log(`\n--- TEST 3: Get profile for member user_id ${members.data[0].user_id} ---`);
      let profile = await supabase.from('profiles').select('*').eq('id', members.data[0].user_id);
      console.log(profile.data);
    }
  }
}

check();
