import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FEATURES } from '@/lib/features'
import { computeNextInterval } from '@/lib/spacedRepetition'

export async function POST(request: NextRequest) {
  if (!FEATURES.SRS) return NextResponse.json({ ok: false })

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { questionId, correct } = await request.json()

    const { data: existing } = await supabase
      .from('srs_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('question_id', questionId)
      .single()

    const reps = existing?.repetitions ?? 0
    const interval = existing?.interval_days ?? 1
    const ease = existing?.ease_factor ?? 2.5

    const next = computeNextInterval(reps, interval, ease, correct)
    const due = new Date()
    due.setDate(due.getDate() + next.interval)

    if (existing) {
      await supabase.from('srs_cards').update({
        due_at: due.toISOString(),
        interval_days: next.interval,
        ease_factor: next.ease,
        repetitions: next.reps,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id)
    } else {
      await supabase.from('srs_cards').insert({
        user_id: user.id,
        question_id: questionId,
        due_at: due.toISOString(),
        interval_days: next.interval,
        ease_factor: next.ease,
        repetitions: next.reps,
      })
    }

    return NextResponse.json({ ok: true, nextDue: due.toISOString(), intervalDays: next.interval })
  } catch (error) {
    console.error('SRS review error:', error)
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
  }
}
