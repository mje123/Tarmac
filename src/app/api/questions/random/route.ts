import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndSaveLegacyQuestions, type LegacyExamType, type LegacyCategory } from '@/lib/generation/legacy'
import { SupabaseClient } from '@supabase/supabase-js'
import { EXAM_QUESTION_DISTRIBUTION, IFR_EXAM_QUESTION_DISTRIBUTION } from '@/lib/utils'
import { generateValidatedQuestion } from '@/lib/generation'
import { CONCEPTS, type ConceptSlug } from '@/lib/generation/concepts'

const PPL_CATEGORIES = new Set(Object.keys(EXAM_QUESTION_DISTRIBUTION))
const IFR_CATEGORIES = new Set(Object.keys(IFR_EXAM_QUESTION_DISTRIBUTION))

const LOW_POOL_THRESHOLD = 20

// Validated, concept-grounded generation runs alongside the legacy one-shot generator
// for every category — built from concepts.ts rather than hardcoded here, so adding a
// concept automatically wires it into refill without touching this route. A category
// can have more than one concept; the least-populated one is topped up first.
const PILOT_CONCEPTS_BY_CATEGORY: Record<string, ConceptSlug[]> = Object.values(CONCEPTS).reduce(
  (acc, concept) => {
    (acc[concept.category] ??= []).push(concept.slug)
    return acc
  },
  {} as Record<string, ConceptSlug[]>
)

async function maybeGeneratePilotConcept(category: string, examType: string) {
  const conceptSlugs = PILOT_CONCEPTS_BY_CATEGORY[category]
  if (!conceptSlugs || conceptSlugs.length === 0) return
  try {
    const admin = createAdminClient()
    const counts = await Promise.all(
      conceptSlugs.map(async slug => {
        const { count } = await admin
          .from('concepts')
          .select('id', { count: 'exact', head: true })
          .eq('slug', slug)
        return { slug, seeded: (count ?? 0) > 0 }
      })
    )

    const { count: totalCount } = await admin
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('category', category)
      .eq('exam_type', examType)
      .not('concept_id', 'is', null)

    // Only generate when this category's validated pool is genuinely low — never on
    // every request. Round-robin across the category's concepts by picking randomly
    // among seeded ones so no single concept dominates the pool.
    if ((totalCount ?? 0) < LOW_POOL_THRESHOLD) {
      const seededSlugs = counts.filter(c => c.seeded).map(c => c.slug)
      if (seededSlugs.length > 0) {
        const pick = seededSlugs[Math.floor(Math.random() * seededSlugs.length)]
        generateValidatedQuestion(pick).catch(() => {})
      }
    }
  } catch { /* non-fatal — question serving must never depend on this */ }
}

async function maybeRefillCategory(category: string, examType: string) {
  maybeGeneratePilotConcept(category, examType)

  try {
    const admin = createAdminClient()
    const { count } = await admin
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('category', category)
      .eq('exam_type', examType)

    if ((count ?? 0) < LOW_POOL_THRESHOLD) {
      generateAndSaveLegacyQuestions(examType as LegacyExamType, category as LegacyCategory, 20).catch(() => {})
    }
  } catch {}
}

async function getHistoryIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data: sessions } = await supabase
    .from('test_sessions')
    .select('id')
    .eq('user_id', userId)
  if (!sessions || sessions.length === 0) return []

  const { data: answers } = await supabase
    .from('test_answers')
    .select('question_id')
    .in('session_id', sessions.map(s => s.id))
  return [...new Set(answers?.map(a => a.question_id as string) || [])]
}

async function runQuery(
  supabase: SupabaseClient,
  userId: string,
  category: string | null,
  categories: string[],
  weak: string | null,
  savedOnly: boolean,
  excludes: string[],
  examType: string
): Promise<{ data: Record<string, unknown>[] | null; empty?: boolean; error?: unknown }> {
  let query = supabase.from('questions').select('*').eq('exam_type', examType)

  if (savedOnly) {
    const { data: saved } = await supabase
      .from('saved_questions')
      .select('question_id')
      .eq('user_id', userId)
    const savedIds = (saved || []).map(r => r.question_id as string)
    if (savedIds.length === 0) return { data: null, empty: true }
    query = query.in('id', savedIds)
  } else if (categories.length > 0) {
    query = query.in('category', categories)
  } else if (category) {
    query = query.eq('category', category)
  } else if (weak) {
    const validCategories = examType === 'ifr' ? IFR_CATEGORIES : PPL_CATEGORIES
    const { data: progress } = await supabase
      .from('user_progress')
      .select('category')
      .eq('user_id', userId)
      .lt('accuracy_percentage', 70)
      .order('accuracy_percentage', { ascending: true })
      .limit(10)
    const weakCats = (progress || [])
      .map(p => p.category as string)
      .filter(c => validCategories.has(c))
      .slice(0, 3)
    if (weakCats.length > 0) {
      query = query.in('category', weakCats)
    }
  }

  if (excludes.length > 0) {
    query = query.not('id', 'in', `(${excludes.join(',')})`)
  }

  const { data, error } = await query
  return { data: data as Record<string, unknown>[] | null, error }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const categories = searchParams.getAll('categories')
    const weak = searchParams.get('weak')
    const savedOnly = searchParams.get('saved') === '1'
    const excludeIds = searchParams.getAll('exclude')
    const examType = searchParams.get('examType') || 'ppl'

    // Trigger refill checks in background (legacy batch refill is PPL-only for now;
    // pilot-concept generation runs for both exam types — see maybeRefillCategory).
    if (categories.length > 0) categories.forEach(c => maybeRefillCategory(c, examType))
    else if (category) maybeRefillCategory(category, examType)

    // Get all question IDs this user has ever answered (cross-session dedup)
    const historyIds = await getHistoryIds(supabase, user.id)
    const fullExcludes = [...new Set([...excludeIds, ...historyIds])]

    // Try showing only unseen questions first
    let result = await runQuery(supabase, user.id, category, categories, weak, savedOnly, fullExcludes, examType)

    if (result.empty) return NextResponse.json({ question: null, empty: true })
    if (result.error) throw result.error

    // If user has seen every question in this pool, cycle through from scratch
    if (!result.data || result.data.length === 0) {
      result = await runQuery(supabase, user.id, category, categories, weak, savedOnly, excludeIds, examType)
      if (result.empty) return NextResponse.json({ question: null, empty: true })
      if (result.error) throw result.error
    }

    const questions = result.data
    if (!questions || questions.length === 0) {
      return NextResponse.json({ question: null })
    }

    const randomIdx = Math.floor(Math.random() * questions.length)
    return NextResponse.json({ question: questions[randomIdx] })
  } catch (error) {
    console.error('Question fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
  }
}
