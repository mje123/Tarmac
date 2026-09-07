import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const COMPARISON_VALUES = ['easier', 'about_same', 'harder']
const FAMILIARITY_VALUES = ['mostly', 'somewhat', 'not_really']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const examType = body.examType === 'ifr' ? 'ifr' : 'ppl'
    const passed = typeof body.passed === 'boolean' ? body.passed : null
    const score = Number.isFinite(body.score) ? Math.max(0, Math.min(100, body.score)) : null
    const comparisonDifficulty = COMPARISON_VALUES.includes(body.comparisonDifficulty) ? body.comparisonDifficulty : null
    const questionsFamiliarity = FAMILIARITY_VALUES.includes(body.questionsFamiliarity) ? body.questionsFamiliarity : null
    const realExamDate = typeof body.realExamDate === 'string' && body.realExamDate ? body.realExamDate : null

    await supabase.from('exam_outcomes').insert({
      user_id: user.id,
      exam_type: examType,
      real_exam_date: realExamDate,
      passed,
      score,
      comparison_difficulty: comparisonDifficulty,
      questions_familiarity: questionsFamiliarity,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('outcome report error:', error)
    return NextResponse.json({ error: 'Failed to save outcome' }, { status: 500 })
  }
}
