import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessExam, EXAM_QUESTION_DISTRIBUTION, IFR_EXAM_QUESTION_DISTRIBUTION } from '@/lib/utils'
import { cookies } from 'next/headers'

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
    const examType = cookieStore.get('tarmac-exam-type')?.value === 'ifr' ? 'ifr' : 'ppl'
    const distribution = examType === 'ifr' ? IFR_EXAM_QUESTION_DISTRIBUTION : EXAM_QUESTION_DISTRIBUTION

    // Fetch all questions by category in parallel
    const categories = Object.keys(distribution)
    const categoryResults = await Promise.all(
      categories.map(cat =>
        supabase.from('questions').select('*').eq('category', cat).eq('exam_type', examType)
      )
    )

    // Build per-category pools (shuffled)
    const pools: Record<string, Record<string, unknown>[]> = {}
    categories.forEach((cat, i) => {
      pools[cat] = (categoryResults[i].data || []).sort(() => Math.random() - 0.5)
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
        selected.push(q)
        usedIds.add(q.id as string)
      }
    }

    const finalQuestions = selected
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
