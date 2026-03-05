import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testDelete() {
  const { data: tasks } = await supabase.from('chakra_tasks').select('id').limit(1)
  if (tasks && tasks.length > 0) {
     const taskId = tasks[0].id
     const { error } = await supabase.from('chakra_tasks').delete().eq('id', taskId)
     console.log("Delete error details:", JSON.stringify(error, null, 2))
  } else {
     console.log("No tasks found to test deletion")
  }
}
testDelete()
