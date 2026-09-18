import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, option_a, option_b, reference')
    .in('id', ['a2246b60-cae2-4a94-bce2-45e32e3603c7', 'b0f61e86-47f0-4092-888c-c9750ec63863'])
  if (error) throw error
  console.log(JSON.stringify(data, null, 2))

  const { count } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .not('verified_at', 'is', null)
  console.log('TOTAL rows across whole bank with verified_at set:', count)
}
main()
