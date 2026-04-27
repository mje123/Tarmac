import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendQuizResultEmail } from '@/lib/emailService'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, topic, score, totalQuestions, missedQuestions } = await request.json()

    await supabase.from('test_sessions').update({
      score,
      total_questions: totalQuestions,
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', sessionId)

    if (process.env.RESEND_API_KEY) {
      try {
        const { data: profile } = await supabase
          .from('users').select('full_name, email').eq('id', user.id).single()

        await sendQuizResultEmail({
          toEmail: profile?.email || user.email || '',
          userName: profile?.full_name || 'Pilot',
          score,
          totalQuestions,
          topic: topic === 'all' ? 'Mixed Topics' : topic,
          missedQuestions,
        })
      } catch (emailErr) {
        console.error('Quiz email failed (non-fatal):', emailErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Quiz submit error:', error)
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 })
  }
}
