import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndSaveLegacyQuestions, type LegacyExamType, type LegacyCategory } from '@/lib/generation/legacy'
import { SupabaseClient } from '@supabase/supabase-js'
import { EXAM_QUESTION_DISTRIBUTION, IFR_EXAM_QUESTION_DISTRIBUTION } from '@/lib/utils'
import { generateValidatedQuestion } from '@/lib/generation'
import { CONCEPTS, type ConceptSlug } from '@/lib/generation/concepts'
import { getUserSessionIds } from '@/lib/userSessions'
import { hasUnservableFigureReference } from '@/lib/figures'

const PPL_CATEGORIES = new Set(Object.keys(EXAM_QUESTION_DISTRIBUTION))
const IFR_CATEGORIES = new Set(Object.keys(IFR_EXAM_QUESTION_DISTRIBUTION))

export const maxDuration = 60

const LOW_POOL_THRESHOLD = 20
// Availability floor only — prevents a category's pool from running dry. Crossing
// this says nothing about ACS-task coverage or content depth (that's ongoing,
// separate content work in generation/concepts.ts); it only means legacy generation
// is no longer needed to keep the pool non-empty.
const VALIDATED_FLOOR = 15

type ConceptMasteryRow = {
  concept_id: string
  attempts: number
  correct: number
  novel_attempts: number
  novel_correct: number
  next_review: string | null
}

type CandidateQuestion = Record<string, unknown> & {
  id: string
  concept_id: string | null
  archetype_id: string | null
  cognitive_level: string | null
  novelty_key: string | null
}

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
    // Legacy is throttled off the VALIDATED pool, not the raw pool — see VALIDATED_FLOOR.
    const { count: validatedCount } = await admin
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('category', category)
      .eq('exam_type', examType)
      .eq('validation_status', 'approved')

    if ((validatedCount ?? 0) < VALIDATED_FLOOR) {
      generateAndSaveLegacyQuestions(examType as LegacyExamType, category as LegacyCategory, 20).catch(() => {})
    }
  } catch {}
}

async function getHistoryIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const sessionIds = await getUserSessionIds(supabase, userId)
  if (sessionIds.length === 0) return []

  const { data: answers } = await supabase
    .from('test_answers')
    .select('question_id')
    .in('session_id', sessionIds)
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
  examType: string,
  conceptId: string | null,
  weaknessConceptIds: string[] | null
): Promise<{ data: Record<string, unknown>[] | null; empty?: boolean; error?: unknown }> {
  let query = supabase.from('questions').select('*').eq('exam_type', examType)

  if (conceptId) {
    // Prove It / concept-scoped requests ignore category filters entirely — a concept
    // determines its own category, and the caller wants variation within it, not a
    // broader category mix.
    query = query.eq('concept_id', conceptId)
  } else if (weaknessConceptIds && weaknessConceptIds.length > 0) {
    // Weakness Attack — restrict the whole candidate pool to the user's weakest
    // concepts rather than just biasing the score toward them, so every question in
    // the session is on-target, not occasionally diluted by a stronger concept.
    query = query.in('concept_id', weaknessConceptIds)
  } else if (savedOnly) {
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

// 5-level cognitive-level staircase driven entirely off existing concept_mastery
// columns — recall -> application -> scenario/multi_concept -> transfer. No new
// schema needed; this is the ramp the spec's "adaptive difficulty" calls for.
const LEVEL_INDEX: Record<string, number> = {
  recall: 0,
  application: 1,
  scenario: 2,
  multi_concept: 2,
  transfer: 3,
}

function targetCognitiveLevel(mastery: ConceptMasteryRow | undefined): string {
  if (!mastery || mastery.attempts < 3) return 'recall'
  const acc = mastery.correct / mastery.attempts
  const novelAcc = mastery.novel_attempts > 0 ? mastery.novel_correct / mastery.novel_attempts : null
  if (acc >= 0.8 && novelAcc != null && novelAcc >= 0.6) return 'transfer'
  if (acc >= 0.8) return 'multi_concept'
  if (acc >= 0.6) return 'scenario'
  return 'application'
}

function cognitiveRampFit(cognitiveLevel: string | null, target: string): number {
  if (!cognitiveLevel) return 0.4 // legacy content with no cognitive_level — neutral, don't starve it
  const qIdx = LEVEL_INDEX[cognitiveLevel] ?? 0
  const tIdx = LEVEL_INDEX[target] ?? 0
  if (qIdx === tIdx) return 1
  if (Math.abs(qIdx - tIdx) <= 1) return 0.3
  return 0
}

interface ScoringContext {
  masteryByConcept: Map<string, ConceptMasteryRow>
  seenArchetypeIds: Set<string>
  recentConceptIds: Set<string>
  now: number
  /** Prove It mode: push hard toward a genuinely different archetype/scenario shape
   *  than the one the student just answered, not a near-duplicate with a harder label. */
  proveIt: boolean
  lastArchetypeId: string | null
}

function scoreQuestion(q: CandidateQuestion, ctx: ScoringContext): number {
  const mastery = q.concept_id ? ctx.masteryByConcept.get(q.concept_id) : undefined

  let dueBoost = 0
  if (mastery?.next_review) {
    const overdueMs = ctx.now - new Date(mastery.next_review).getTime()
    if (overdueMs >= 0) {
      const overdueDays = overdueMs / (24 * 60 * 60 * 1000)
      dueBoost = Math.min(2, 1 + overdueDays / 7)
    }
  }

  const weakConceptBoost = mastery && mastery.attempts > 0
    ? Math.max(0, Math.min(1, 1 - mastery.correct / mastery.attempts))
    : 0.5 // never attempted — neutral, not assumed weak

  let noveltyTargetBoost = 0
  if (q.cognitive_level === 'transfer') noveltyTargetBoost = 1
  else if (q.archetype_id && !ctx.seenArchetypeIds.has(q.archetype_id)) noveltyTargetBoost = 1

  const target = targetCognitiveLevel(mastery)
  const rampFit = cognitiveRampFit(q.cognitive_level, target)

  let interleaveBoost = 0
  if (q.concept_id) interleaveBoost = ctx.recentConceptIds.has(q.concept_id) ? -1 : 1

  let score = 3.0 * dueBoost + 2.0 * weakConceptBoost + 1.5 * noveltyTargetBoost
    + 1.0 * rampFit + 0.5 * interleaveBoost + Math.random() * 0.5

  if (ctx.proveIt && ctx.lastArchetypeId && q.archetype_id && q.archetype_id !== ctx.lastArchetypeId) {
    score += 5 // dominant bonus — a different reasoning shape beats every other signal
  }

  return score
}

/** Weighted-random sample from the top-N scored candidates (not deterministic argmax)
 *  so selection never fully collapses to one question, which would feel gameable. */
function pickWeighted(scored: { q: CandidateQuestion; score: number }[], topN = 5): CandidateQuestion {
  const top = [...scored].sort((a, b) => b.score - a.score).slice(0, Math.max(1, topN))
  const minScore = Math.min(...top.map(s => s.score))
  const weights = top.map(s => s.score - minScore + 0.1) // keep every entry weight > 0
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < top.length; i++) {
    r -= weights[i]
    if (r <= 0) return top[i].q
  }
  return top[top.length - 1].q
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
    const recentConceptIds = searchParams.getAll('recentConcept')
    const conceptId = searchParams.get('conceptId')
    const proveIt = searchParams.get('proveIt') === '1'
    const lastArchetypeId = searchParams.get('lastArchetypeId')
    const lastNoveltyKey = searchParams.get('lastNoveltyKey')
    const minCognitiveLevel = searchParams.get('minCognitiveLevel')
    const maxCognitiveLevel = searchParams.get('maxCognitiveLevel')
    const weaknessOnly = searchParams.get('weaknessOnly') === '1'

    // Runs after the response is sent (see maxDuration above) rather than as a bare
    // unawaited promise — a serverless function can be frozen/terminated the moment
    // the response finishes, which was silently killing this refill before it ever
    // reached a single Anthropic call or question_generation_log write (confirmed via
    // direct invocation: the pipeline itself works fine, it just never got to run).
    if (!conceptId && categories.length > 0) categories.forEach(c => after(() => maybeRefillCategory(c, examType)))
    else if (!conceptId && category) after(() => maybeRefillCategory(category, examType))

    let weaknessConceptIds: string[] | null = null
    if (weaknessOnly) {
      const { data: weakest } = await supabase
        .from('concept_mastery')
        .select('concept_id, attempts, correct, concepts!inner(exam_type)')
        .eq('user_id', user.id)
        .eq('concepts.exam_type', examType)
        .gt('attempts', 0)
      type Row = { concept_id: string; attempts: number; correct: number }
      weaknessConceptIds = ((weakest || []) as unknown as Row[])
        .sort((a, b) => (a.correct / a.attempts) - (b.correct / b.attempts))
        .slice(0, 3)
        .map(r => r.concept_id)
      if (weaknessConceptIds.length === 0) return NextResponse.json({ question: null, empty: true })
    }

    const historyIds = await getHistoryIds(supabase, user.id)
    const fullExcludes = [...new Set([...excludeIds, ...historyIds])]

    let result = await runQuery(supabase, user.id, category, categories, weak, savedOnly, fullExcludes, examType, conceptId, weaknessConceptIds)

    if (result.empty) return NextResponse.json({ question: null, empty: true })
    if (result.error) throw result.error

    if (!result.data || result.data.length === 0) {
      result = await runQuery(supabase, user.id, category, categories, weak, savedOnly, excludeIds, examType, conceptId, weaknessConceptIds)
      if (result.empty) return NextResponse.json({ question: null, empty: true })
      if (result.error) throw result.error
    }

    let questions = (result.data || []) as CandidateQuestion[]
    // Never serve a question that references a figure/chart we don't have a real image
    // for — unlike the other filters below, this one is unconditional (not "only if it
    // leaves candidates") because a figure-dependent question with no visual is
    // unanswerable, not just suboptimal.
    questions = questions.filter(q => !hasUnservableFigureReference(String(q.question_text ?? '')))
    if (lastNoveltyKey) questions = questions.filter(q => q.novelty_key !== lastNoveltyKey)

    // Learn/Transfer mode hard filters — legacy content with no cognitive_level always
    // passes through (there's nothing to filter it by), so these modes don't dead-end
    // on categories concept coverage hasn't fully reached yet.
    if (minCognitiveLevel) {
      const minIdx = LEVEL_INDEX[minCognitiveLevel] ?? 0
      const filtered = questions.filter(q => !q.cognitive_level || (LEVEL_INDEX[q.cognitive_level] ?? 0) >= minIdx)
      if (filtered.length > 0) questions = filtered
    }
    if (maxCognitiveLevel) {
      const maxIdx = LEVEL_INDEX[maxCognitiveLevel] ?? 0
      const filtered = questions.filter(q => !q.cognitive_level || (LEVEL_INDEX[q.cognitive_level] ?? 0) <= maxIdx)
      if (filtered.length > 0) questions = filtered
    }

    if (questions.length === 0) return NextResponse.json({ question: null })

    const conceptIds = [...new Set(questions.map(q => q.concept_id).filter((c): c is string => !!c))]
    const masteryByConcept = new Map<string, ConceptMasteryRow>()
    if (conceptIds.length > 0) {
      const { data: masteryRows } = await supabase
        .from('concept_mastery')
        .select('concept_id, attempts, correct, novel_attempts, novel_correct, next_review')
        .eq('user_id', user.id)
        .in('concept_id', conceptIds)
      for (const row of masteryRows || []) masteryByConcept.set(row.concept_id as string, row as ConceptMasteryRow)
    }

    let seenArchetypeIds = new Set<string>()
    if (conceptIds.length > 0 && historyIds.length > 0) {
      const { data: seenQuestions } = await supabase
        .from('questions')
        .select('archetype_id')
        .in('id', historyIds)
        .not('archetype_id', 'is', null)
      seenArchetypeIds = new Set((seenQuestions || []).map(q => q.archetype_id as string))
    }

    const ctx: ScoringContext = {
      masteryByConcept,
      seenArchetypeIds,
      recentConceptIds: new Set(recentConceptIds),
      now: Date.now(),
      proveIt,
      lastArchetypeId,
    }

    const scored = questions.map(q => ({ q, score: scoreQuestion(q, ctx) }))
    const picked = pickWeighted(scored)
    return NextResponse.json({ question: picked })
  } catch (error) {
    console.error('Question fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
  }
}
