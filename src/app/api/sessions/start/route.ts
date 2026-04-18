import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const FREE_QUESTION_LIMIT = 20

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userProfile } = await supabase
      .from('users').select('subscription_status, subscription_expires_at').eq('id', user.id).single()

    const isFree = !userProfile || userProfile.subscription_status === 'free'
    const isExpired = userProfile?.subscription_expires_at && new Date(userProfile.subscription_expires_at) < new Date()

    if (isFree || isExpired) {
      const { count } = await supabase
        .from('test_answers')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', user.id)

      const { data: sessions } = await supabase
        .from('test_sessions')
        .select('id')
        .eq('user_id', user.id)

      const sessionIds = sessions?.map(s => s.id) || []

      let totalAnswered = 0
      if (sessionIds.length > 0) {
        const { count: ansCount } = await supabase
          .from('test_answers')
          .select('id', { count: 'exact', head: true })
          .in('session_id', sessionIds)
        totalAnswered = ansCount || 0
      }

      if (totalAnswered >= FREE_QUESTION_LIMIT) {
        return NextResponse.json({ error: 'FREE_LIMIT', freeQuestionsLeft: 0 })
      }

      const { data: session, error } = await supabase.from('test_sessions').insert({
        user_id: user.id,
        session_type: 'practice_mode',
        total_questions: 0,
        status: 'in_progress',
      }).select('id').single()

      if (error) throw error
      return NextResponse.json({
        sessionId: session.id,
        freeQuestionsLeft: FREE_QUESTION_LIMIT - totalAnswered,
      })
    }

    const { data: session, error } = await supabase.from('test_sessions').insert({
      user_id: user.id,
      session_type: 'practice_mode',
      total_questions: 0,
      status: 'in_progress',
    }).select('id').single()

    if (error) throw error
    return NextResponse.json({ sessionId: session.id, freeQuestionsLeft: null })
  } catch (error) {
    console.error('Session start error:', error)
    return NextResponse.json({ error: 'Failed to start session' }, { status: 500 })
  }
}
