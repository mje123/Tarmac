import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, questionId, answer, isCorrect } = await request.json()

    await supabase.from('test_answers').insert({
      session_id: sessionId,
      question_id: questionId,
      user_answer: answer,
      is_correct: isCorrect,
      answered_at: new Date().toISOString(),
    })

    const { data: question } = await supabase
      .from('questions').select('category').eq('id', questionId).single()

    if (question) {
      const { data: existing } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', question.category)
        .single()

      if (existing) {
        const newAttempted = existing.questions_attempted + 1
        const newCorrect = existing.questions_correct + (isCorrect ? 1 : 0)
        await supabase.from('user_progress').update({
          questions_attempted: newAttempted,
          questions_correct: newCorrect,
          accuracy_percentage: (newCorrect / newAttempted) * 100,
          last_practiced: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id)
      } else {
        await supabase.from('user_progress').insert({
          user_id: user.id,
          category: question.category,
          questions_attempted: 1,
          questions_correct: isCorrect ? 1 : 0,
          accuracy_percentage: isCorrect ? 100 : 0,
          last_practiced: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Answer submit error:', error)
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 })
  }
}
