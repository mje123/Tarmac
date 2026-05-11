import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: idRows, error: idErr } = await supabase
    .from('questions')
    .select('id')
    .eq('exam_type', 'ppl')

  if (idErr || !idRows) return NextResponse.json({ error: 'Failed' }, { status: 500 })

  // Fisher-Yates shuffle, pick 20
  const ids = idRows.map(r => r.id as string)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]]
  }
  const picked = ids.slice(0, 20)

  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, category, difficulty')
    .in('id', picked)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Shuffle output order too
  const shuffled = (questions || []).sort(() => Math.random() - 0.5)
  return NextResponse.json({ questions: shuffled })
}
