import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, option_c, reference, explanation, source_section, verified_at, verified_by, validation_log')
    .in('id', ['9c98684e-4bd1-4000-89d1-f3db76eed1f8', '8b1a4c36-b5a2-4191-94f6-b767217bf8e1'])
  if (error) throw error
  console.log(JSON.stringify(data, null, 2))

  const { count } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('category', 'IFR Regulations')
    .not('verified_at', 'is', null)
  console.log('IFR Regulations rows with verified_at set:', count)

  const { count: totalVerified } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .not('verified_at', 'is', null)
  console.log('TOTAL rows across whole bank with verified_at set:', totalVerified)
}
main()
