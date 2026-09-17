import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, correct_answer, option_c, validation_status, reference')
    .in('id', ['4155cdb7-d066-4f1b-bcaf-36b2a0cd575e', '5d0f19a9-3fda-4ebd-a5c2-71a51af76e15'])
  if (error) throw error
  console.log(JSON.stringify(data, null, 2))

  const { count } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .not('verified_at', 'is', null)
  console.log('TOTAL rows across whole bank with verified_at set:', count)
}
main()
