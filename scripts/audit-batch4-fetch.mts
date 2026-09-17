import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const category = process.argv[2]
  const { data, error } = await supabase
    .from('questions')
    .select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, reference, category, exam_type, validation_status')
    .eq('category', category)
    .is('verified_at', null)
    .order('id')
    .range(0, 32)
  if (error) throw error
  console.log(JSON.stringify(data, null, 2))
  console.error('COUNT:', data?.length)
}
main()
