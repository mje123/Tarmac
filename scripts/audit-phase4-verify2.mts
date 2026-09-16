import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, correct_answer, option_a, option_b, validation_status, reference, explanation')
    .in('id', ['2558aa0d-acf1-4792-a447-453c352c9067', '280ee573-1832-44d8-b1ec-2ca46bdb2e9d'])
  if (error) throw error
  console.log(JSON.stringify(data, null, 2))

  const { count } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .not('verified_at', 'is', null)
  console.log('TOTAL rows across whole bank with verified_at set:', count)
}
main()
