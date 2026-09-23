import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, question_text, option_a, option_b, validation_status')
    .in('id', [
      '2b4da8e5-3dd7-4656-ab7e-46ec73e79bb5',
      '3704f585-ef49-4389-bae5-493d24d0b469',
      '4696f2c8-aa31-459c-bc8a-7a72ccd39ecc',
      '22e6a82a-3bbf-433a-9ee6-1cc4c3a5eb2f',
    ])
  if (error) throw error
  console.log(JSON.stringify(data, null, 2))

  const { count } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .not('verified_at', 'is', null)
  console.log('TOTAL rows across whole bank with verified_at set:', count)
}
main()
