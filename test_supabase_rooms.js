import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
    console.log("Fetching crops matching Beccar...");
    const { data: crops, error: cropsErr } = await supabase
        .from('chakra_crops')
        .select('id, name')
        .ilike('name', '%beccar%');

    if (cropsErr) {
        console.error("Error crops:", cropsErr);
        return;
    }
    console.log("Crops:", crops);

    if (crops && crops.length > 0) {
        const cropId = crops[0].id;
        console.log(`Fetching rooms for Crop ID: ${cropId}...`);

        const { data: rooms, error: roomsErr } = await supabase
            .from('rooms')
            .select('id, name, type, spot_id')
            .eq('spot_id', cropId);

        if (roomsErr) {
            console.error("Error rooms:", roomsErr);
            return;
        }
        console.log("Rooms:", rooms);

        if (rooms && rooms.length > 0) {
            const roomIds = rooms.map(r => r.id);
            const { data: maps } = await supabase.from('clone_maps').select('id, name, room_id').in('room_id', roomIds);
            console.log("Maps:", maps);
        }
    }
}

test();
