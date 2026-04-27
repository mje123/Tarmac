import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const sessionType = body.sessionType === 'quiz' ? 'quiz' : 'practice_mode'

    const { data: session, error } = await supabase.from('test_sessions').insert({
      user_id: user.id,
      session_type: sessionType,
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
