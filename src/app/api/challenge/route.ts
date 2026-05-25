import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = createAdminClient()

  // Pull hard questions
  const { data: questions } = await admin
    .from('questions')
    .select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, category, explanation')
    .eq('exam_type', 'ppl')
    .eq('difficulty', 'hard')
    .limit(200)

  if (!questions?.length) return NextResponse.json({ error: 'No questions' }, { status: 500 })

  // Pick a pseudo-random question based on today's date so it rotates daily
  const today = new Date().toISOString().slice(0, 10)
  const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0)
  const q = questions[seed % questions.length]

  // Get accuracy stat from test_answers if available
  const { data: answers } = await admin
    .from('test_answers')
    .select('is_correct')
    .eq('question_id', q.id)
    .limit(500)

  let wrongPct = 72 // fallback if no data yet
  if (answers && answers.length >= 10) {
    const wrong = answers.filter(a => !a.is_correct).length
    wrongPct = Math.round((wrong / answers.length) * 100)
  }

  return NextResponse.json({
    question: {
      id: q.id,
      question_text: q.question_text,
      options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
      correct: q.correct_answer,
      category: q.category,
      explanation: q.explanation,
    },
    wrongPct,
    date: today,
  })
}
