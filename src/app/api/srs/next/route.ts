import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FEATURES } from '@/lib/features'

export async function GET() {
  if (!FEATURES.SRS) return NextResponse.json({ question: null, done: true })

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date().toISOString()

    // First try: enrolled cards that are due
    const { data: dueCards } = await supabase
      .from('srs_cards')
      .select('question_id')
      .eq('user_id', user.id)
      .lte('due_at', now)
      .order('due_at', { ascending: true })
      .limit(1)

    if (dueCards && dueCards.length > 0) {
      const { data: question } = await supabase
        .from('questions')
        .select('*')
        .eq('id', dueCards[0].question_id)
        .single()
      if (question) return NextResponse.json({ question, isNew: false })
    }

    // Second try: missed questions not yet enrolled
    const { data: enrolled } = await supabase
      .from('srs_cards')
      .select('question_id')
      .eq('user_id', user.id)

    const enrolledIds = (enrolled || []).map(r => r.question_id as string)

    const { data: sessions } = await supabase
      .from('test_sessions')
      .select('id')
      .eq('user_id', user.id)

    const sessionIds = (sessions || []).map(s => s.id as string)
    if (sessionIds.length === 0) return NextResponse.json({ question: null, done: true })

    const excludeClause = enrolledIds.length > 0
      ? `(${enrolledIds.join(',')})`
      : '(00000000-0000-0000-0000-000000000000)'

    const { data: missed } = await supabase
      .from('test_answers')
      .select('question_id')
      .eq('is_correct', false)
      .in('session_id', sessionIds)
      .not('question_id', 'in', excludeClause)
      .limit(1)

    if (missed && missed.length > 0) {
      const { data: question } = await supabase
        .from('questions')
        .select('*')
        .eq('id', missed[0].question_id)
        .single()
      if (question) return NextResponse.json({ question, isNew: true })
    }

    return NextResponse.json({ question: null, done: true })
  } catch (error) {
    console.error('SRS next error:', error)
    return NextResponse.json({ question: null, done: true })
  }
}
