import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Manual parsing since dotenv.config might not pick up .env.local easily
const envContent = fs.readFileSync(path.resolve('.env'), 'utf-8');
const env = dotenv.parse(envContent);

const supabase = createClient(env.REACT_APP_SUPABASE_URL, env.REACT_APP_SUPABASE_ANON_KEY);

async function run() {
    const { data: batches } = await supabase.from('batches')
        .select('id, name, organization_id, current_room_id, room:rooms(organization_id)')
        .is('organization_id', null)
        .not('current_room_id', 'is', null);

    console.log(`Found ${batches?.length || 0} batches with null organization_id but valid room.`);

    if (batches && batches.length > 0) {
        let fixed = 0;
        for (const batch of batches) {
            if (batch.room && batch.room.organization_id) {
                const { error } = await supabase.from('batches')
                    .update({ organization_id: batch.room.organization_id })
                    .eq('id', batch.id);

                if (!error) fixed++;
                else console.error(`Error fixing batch ${batch.id}:`, error);
            }
        }
        console.log(`Successfully fixed ${fixed} batches!`);
    }
}
run();
