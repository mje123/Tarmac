import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import { matchFigureReference } from '../src/lib/figures'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function fetchAll() {
  const all: { id: string; question_text: string; category: string; exam_type: string; validation_status: string }[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('id, question_text, category, exam_type, validation_status')
      .range(from, from + 999)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < 1000) break
    from += 1000
  }
  return all
}

async function main() {
  const all = await fetchAll()
  const affected = all.filter(q => matchFigureReference(q.question_text)?.key === 'Figure 32')
  for (const q of affected) {
    console.log(`${q.id}  [${q.exam_type}/${q.category}]  status=${q.validation_status}  "${q.question_text.slice(0, 100)}"`)
  }
  console.log(`\nTotal referencing "Figure 32" via real matcher: ${affected.length}`)

  // Also check whether any of these mention "Figures 32 and 33" (meaning Figure 33 is silently dropped)
  const dual = affected.filter(q => /figures?\s+32\s+and\s+33/i.test(q.question_text))
  console.log(`Of those, mention "Figures 32 and 33" (so Figure 33 is silently never shown): ${dual.length}`)
}
main()
