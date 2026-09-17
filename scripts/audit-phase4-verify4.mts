import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, correct_answer, option_b, option_c, reference')
    .in('id', ['66faeef0-fb96-4137-b89e-937a9b7fe778', '83ec2877-f21f-47c2-bce5-7b97b205de0e', '884da62d-0ca2-4ffd-9179-4cd4df4151bd'])
  if (error) throw error
  console.log(JSON.stringify(data, null, 2))

  const { count } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .not('verified_at', 'is', null)
  console.log('TOTAL rows across whole bank with verified_at set:', count)
}
main()
