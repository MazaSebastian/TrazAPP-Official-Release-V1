import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
const envConfig = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envConfig[key.trim()] = value.trim();
    }
});

const supabaseUrl = envConfig['VITE_SUPABASE_URL'];
const supabaseKey = envConfig['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRooms() {
    const { data: crops } = await supabase.from('chakra_crops').select('id, name');
    console.log("All Crops:", crops);

    if (!crops || crops.length === 0) return;

    for (const crop of crops) {
        if (crop.name.toLowerCase().includes('beccar')) {
            console.log(`\nFound Crop Beccar: ${crop.id}`);
            const { data: rooms } = await supabase.from('rooms').select('id, name').eq('spot_id', crop.id);
            console.log(`Rooms in Beccar:`, rooms);

            if (rooms) {
                for (const r of rooms) {
                    const { data: maps } = await supabase.from('clone_maps').select('id, name').eq('room_id', r.id);
                    console.log(`  Maps in ${r.name}:`, maps);
                }
            }
        }
    }
}

checkRooms();
