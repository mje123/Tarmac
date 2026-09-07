import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FEATURES } from '@/lib/features'

export async function GET() {
  if (!FEATURES.SRS) return NextResponse.json({ count: 0, question: null })

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date().toISOString()

    // Primary source: due concepts in concept_mastery.
    const { count: conceptDue } = await supabase
      .from('concept_mastery')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('next_review', now)

    // Fallback source: legacy per-question srs_cards, still live for non-concept content.
    const { count: cardsDue } = await supabase
      .from('srs_cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('due_at', now)

    const { data: enrolled } = await supabase
      .from('srs_cards')
      .select('question_id')
      .eq('user_id', user.id)

    const enrolledIds = (enrolled || []).map(r => r.question_id as string)

    const { count: newCount } = await supabase
      .from('test_answers')
      .select('question_id', { count: 'exact', head: true })
      .eq('is_correct', false)
      .in('session_id',
        (await supabase.from('test_sessions').select('id').eq('user_id', user.id)).data?.map(s => s.id) || []
      )
      .not('question_id', 'in', enrolledIds.length > 0 ? `(${enrolledIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)')

    const total = (conceptDue ?? 0) + (cardsDue ?? 0) + (newCount ?? 0)

    return NextResponse.json({ count: total })
  } catch (error) {
    console.error('SRS due error:', error)
    return NextResponse.json({ count: 0 })
  }
}
