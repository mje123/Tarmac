import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    if (!sessionId) return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })

    const { data: session, error: sessionError } = await supabase
      .from('test_sessions')
      .select('id, score, total_questions, completed_at, started_at')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const { data: answers, error: answersError } = await supabase
      .from('test_answers')
      .select('*, questions(*)')
      .eq('session_id', sessionId)

    if (answersError) throw answersError

    return NextResponse.json({ session, answers: answers ?? [] })
  } catch (error) {
    console.error('Exam results error:', error)
    return NextResponse.json({ error: 'Failed to fetch exam results' }, { status: 500 })
  }
}
