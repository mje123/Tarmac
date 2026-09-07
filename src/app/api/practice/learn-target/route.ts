import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Picks the concept Learn mode should teach next — the user's weakest concept with
 *  at least one attempt, or (for a brand-new user with no concept_mastery rows at
 *  all) the least-recently-touched seeded concept for their exam type, so Learn mode
 *  never has nothing to show. */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const examType = searchParams.get('examType') || 'ppl'

    const { data: masteryRows } = await supabase
      .from('concept_mastery')
      .select('concept_id, attempts, correct, concepts!inner(id, name, rule_summary, authoritative_source, exam_type)')
      .eq('user_id', user.id)
      .eq('concepts.exam_type', examType)
      .gt('attempts', 0)

    type Row = { attempts: number; correct: number; concepts: { id: string; name: string; rule_summary: string; authoritative_source: string } | { id: string; name: string; rule_summary: string; authoritative_source: string }[] }
    const rows = (masteryRows || []) as unknown as Row[]
    const normalized = rows
      .map(r => ({ attempts: r.attempts, correct: r.correct, concept: Array.isArray(r.concepts) ? r.concepts[0] : r.concepts }))
      .filter(r => r.concept)

    if (normalized.length > 0) {
      const weakest = [...normalized].sort((a, b) => (a.correct / a.attempts) - (b.correct / b.attempts))[0]
      return NextResponse.json({ concept: weakest.concept })
    }

    // No history yet — any active seeded concept for this exam type will do.
    const { data: anyConcept } = await supabase
      .from('concepts')
      .select('id, name, rule_summary, authoritative_source')
      .eq('exam_type', examType)
      .eq('is_active', true)
      .limit(1)
      .single()

    return NextResponse.json({ concept: anyConcept ?? null })
  } catch (error) {
    console.error('learn-target error:', error)
    return NextResponse.json({ concept: null })
  }
}
