import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.REACT_APP_SUPABASE_URL;
const supabaseKey = envConfig.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fallback palette
const GENETIC_PALETTE = [
    '#F0FFF4', '#EBF8FF', '#FAF5FF', '#FFF5F5', '#FFFFF0',
    '#F0F5FF', '#E6FFFA', '#FDF2F8', '#FFFAF0', '#F7FAFC',
    '#FEFCBF', '#C6F6D5', '#BEE3F8', '#E9D8FD', '#FED7D7',
    '#FEEBC8', '#C4F1F9', '#D6BCFA', '#9AE6B4', '#FBD38D',
    '#A3BFFA', '#F687B3'
];

export const getGeneticColor = (name) => {
    if (!name) return '#F0FFF4'; // Default Green

    let hash = 5381;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) + hash) + name.charCodeAt(i); 
    }

    const index = Math.abs(hash) % GENETIC_PALETTE.length;
    return GENETIC_PALETTE[index];
};


async function addColorColumnAndBackfill() {
  try {
    console.log("Checking if we need to backfill colors for existing genetics...");
    
    // First let's fetch all genetics
    const { data: genetics, error: fetchError } = await supabase
      .from('genetics')
      .select('id, name');
      
    if (fetchError) {
        if (fetchError.message.includes("Could not find the 'color' column")) {
            console.error("The column must be added via SQL editor in Supabase Dashboard.");
            console.log("Please run this SQL in Supabase SQL Editor:\nALTER TABLE genetics ADD COLUMN color character varying(7);");
            return; // We can't do it from anon key if RLS/Permissions restrict DDL
        }
        throw fetchError;
    }
    
    console.log(`Found ${genetics?.length || 0} genetics.`);
    if (!genetics || genetics.length === 0) return;

    // Test updating one to see if the column exists
    const testGen = genetics[0];
    const { error: testError } = await supabase
        .from('genetics')
        .update({ color: getGeneticColor(testGen.name) })
        .eq('id', testGen.id);

    if (testError) {
        if (testError.message.includes("Could not find the 'color' column") || testError.code === 'PGRST204') {
            console.error("\nThe 'color' column does NOT exist yet.");
            console.log("-----------------------------------------");
            console.log("PLEASE RUN THE FOLLOWING SQL IN YOUR SUPABASE DASHBOARD:\n");
            console.log("ALTER TABLE genetics ADD COLUMN color character varying(7);");
            console.log("-----------------------------------------\n");
            process.exit(1);
        } else {
             console.log("Warning on test update:", testError.message);
             // Proceed to update the rest if it's just RLS warning or something we can bypass
        }
    }

    let updated = 0;
    for (const gen of genetics) {
        const assignedColor = getGeneticColor(gen.name);
        const { error: updateError } = await supabase
            .from('genetics')
            .update({ color: assignedColor })
            .eq('id', gen.id);
            
        if (!updateError) {
            updated++;
        }
    }
    console.log(`Successfully backfilled colors for ${updated} genetics.`);

  } catch (err) {
    console.error(err);
  }
}

addColorColumnAndBackfill();
