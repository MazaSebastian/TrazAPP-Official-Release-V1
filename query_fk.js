import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function getFKeys() {
  const { data, error } = await supabase.rpc('get_foreign_keys_referencing', { target_table: 'chakra_tasks' })
  console.log(data || error)
}
getFKeys()
