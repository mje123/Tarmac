import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: sessions, error } = await supabase
      .from('test_sessions')
      .select('id, score, total_questions, completed_at, started_at, time_remaining_seconds')
      .eq('user_id', user.id)
      .eq('session_type', 'real_exam')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ sessions: sessions ?? [] })
  } catch (error) {
    console.error('Exam history error:', error)
    return NextResponse.json({ error: 'Failed to fetch exam history' }, { status: 500 })
  }
}
