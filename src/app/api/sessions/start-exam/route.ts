import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessExam, EXAM_QUESTION_DISTRIBUTION, IFR_EXAM_QUESTION_DISTRIBUTION } from '@/lib/utils'
import { cookies } from 'next/headers'
import { getEffectiveExamType } from '@/lib/examType'
import { hasUnservableFigureReference } from '@/lib/figures'

const TOTAL_QUESTIONS = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('subscription_status, subscription_expires_at').eq('id', user.id).single()

    const isExpired = profile?.subscription_expires_at && new Date(profile.subscription_expires_at) < new Date()
    if (!profile || !canAccessExam(profile.subscription_status) || isExpired) {
      return NextResponse.json({ error: 'ACCESS_DENIED' }, { status: 403 })
    }

    const cookieStore = await cookies()
    const examType = await getEffectiveExamType(supabase, user.id, cookieStore.get('tarmac-exam-type')?.value)
    const distribution = examType === 'ifr' ? IFR_EXAM_QUESTION_DISTRIBUTION : EXAM_QUESTION_DISTRIBUTION

    // A closed tab or crash never submits, leaving the old session 'in_progress'
    // forever — with no expiry, a stat query counting "exams taken" would grow
    // unboundedly with sessions nobody ever finished. Starting a new exam is the one
    // natural point to clean that up; the 150-minute limit itself still relies on the
    // client-side timer (see exam-session/page.tsx), this only bounds the mess left
    // behind when it's never reached.
    await supabase.from('test_sessions')
      .update({ status: 'abandoned' })
      .eq('user_id', user.id)
      .eq('session_type', 'real_exam')
      .eq('status', 'in_progress')

    // Fetch all questions by category in parallel
    const categories = Object.keys(distribution)
    const categoryResults = await Promise.all(
      categories.map(cat =>
        supabase.from('questions').select('*').eq('category', cat).eq('exam_type', examType)
      )
    )

    // Build per-category pools (shuffled). A real timed exam is the worst possible
    // place to serve an unanswerable figure-dependent question, so this filter is
    // unconditional — a category coming up short as a result is preferable to a
    // student staring at "refer to the figure below" with nothing rendered.
    const pools: Record<string, Record<string, unknown>[]> = {}
    categories.forEach((cat, i) => {
      pools[cat] = (categoryResults[i].data || [])
        .filter(q => !hasUnservableFigureReference(String((q as { question_text?: string }).question_text ?? '')))
        .sort(() => Math.random() - 0.5)
    })

    // Phase 1: allocate min questions from each category
    const selected: Record<string, unknown>[] = []
    const usedIds = new Set<string>()

    for (const [cat, { min }] of Object.entries(distribution)) {
      const pool = pools[cat]
      const take = Math.min(min, pool.length)
      for (let i = 0; i < take; i++) {
        selected.push(pool[i])
        usedIds.add(pool[i].id as string)
      }
    }

    // Phase 2: fill up to TOTAL_QUESTIONS using remaining questions from any category
    if (selected.length < TOTAL_QUESTIONS) {
      const remaining: Record<string, unknown>[] = []
      for (const [cat, { min, max }] of Object.entries(distribution)) {
        const pool = pools[cat]
        // Already took 'min', now offer up to 'max - min' more
        const alreadyTook = Math.min(min, pool.length)
        const canTakeMore = max - min
        for (let i = alreadyTook; i < alreadyTook + canTakeMore && i < pool.length; i++) {
          if (!usedIds.has(pool[i].id as string)) {
            remaining.push(pool[i])
          }
        }
      }
      // Shuffle and take what's needed
      remaining.sort(() => Math.random() - 0.5)
      for (const q of remaining) {
        if (selected.length >= TOTAL_QUESTIONS) break
        if (!usedIds.has(q.id as string)) {
          selected.push(q)
          usedIds.add(q.id as string)
        }
      }
    }

    // Phase 3: if still short, pull from any category not yet used
    if (selected.length < TOTAL_QUESTIONS) {
      const overflow: Record<string, unknown>[] = []
      for (const pool of Object.values(pools)) {
        for (const q of pool) {
          if (!usedIds.has(q.id as string)) overflow.push(q)
        }
      }
      overflow.sort(() => Math.random() - 0.5)
      for (const q of overflow) {
        if (selected.length >= TOTAL_QUESTIONS) break
        if (!usedIds.has(q.id as string)) {
          selected.push(q)
          usedIds.add(q.id as string)
        }
      }
    }

    // Final dedup guard in case any question slipped through twice
    const seen = new Set<string>()
    const deduped = selected.filter(q => {
      if (seen.has(q.id as string)) return false
      seen.add(q.id as string)
      return true
    })

    const finalQuestions = deduped
      .sort(() => Math.random() - 0.5)
      .slice(0, TOTAL_QUESTIONS)

    const { data: session, error } = await supabase.from('test_sessions').insert({
      user_id: user.id,
      session_type: 'real_exam',
      total_questions: finalQuestions.length,
      time_remaining_seconds: 150 * 60,
      status: 'in_progress',
    }).select('id').single()

    if (error) throw error

    return NextResponse.json({ sessionId: session.id, questions: finalQuestions })
  } catch (error) {
    console.error('Exam start error:', error)
    return NextResponse.json({ error: 'Failed to start exam' }, { status: 500 })
  }
}
