import type { SupabaseClient } from '@supabase/supabase-js'
import { computeNextInterval, type ConfidenceLevel } from './spacedRepetition'

export interface MasteryUpdateResult {
  /** correct/attempts BEFORE this update, or null if this is the user's first attempt
   *  on the concept — used by classifyError to distinguish a genuine gap from a slip
   *  on a concept the student otherwise knows well. */
  priorAccuracy: number | null
}

/**
 * Single source of truth for writing to concept_mastery — SM-2-style scheduling,
 * confidence-bucketed counters, and novel_attempts/novel_correct. Shared by
 * api/sessions/answer (practice/quiz) and api/srs/review (daily review), so the two
 * spaced-repetition surfaces converge on one mastery signal instead of drifting.
 */
export async function updateConceptMastery(
  supabase: SupabaseClient,
  userId: string,
  conceptId: string,
  isCorrect: boolean,
  confidence: ConfidenceLevel | null,
  isNovel: boolean
): Promise<MasteryUpdateResult> {
  const now = new Date()

  const { data: existing } = await supabase
    .from('concept_mastery')
    .select('*')
    .eq('user_id', userId)
    .eq('concept_id', conceptId)
    .single()

  const priorAccuracy = existing && existing.attempts > 0 ? existing.correct / existing.attempts : null

  const reps = existing?.repetitions ?? 0
  const intervalDays = existing?.interval_days ?? 1
  const ease = existing?.ease_factor ?? 2.5
  const next = computeNextInterval(reps, intervalDays, ease, isCorrect)
  const nextReview = new Date(now.getTime() + next.interval * 24 * 60 * 60 * 1000)

  const isConfident = confidence === 'very_confident' || confidence === 'somewhat_confident'
  const confidenceDelta: Record<string, number> = confidence == null ? {} : isCorrect
    ? isConfident ? { confident_correct: 1 } : { guess_correct: 1 }
    : isConfident ? { confident_wrong: 1 } : { guess_wrong: 1 }
  const novelDelta: Record<string, number> = isNovel
    ? { novel_attempts: 1, ...(isCorrect ? { novel_correct: 1 } : {}) }
    : {}

  if (existing) {
    const updates: Record<string, unknown> = {
      attempts: existing.attempts + 1,
      correct: existing.correct + (isCorrect ? 1 : 0),
      last_seen: now.toISOString(),
      next_review: nextReview.toISOString(),
      ease_factor: next.ease,
      interval_days: next.interval,
      repetitions: next.reps,
      updated_at: now.toISOString(),
    }
    for (const [key, delta] of Object.entries({ ...confidenceDelta, ...novelDelta })) {
      updates[key] = (existing[key] ?? 0) + delta
    }
    await supabase.from('concept_mastery').update(updates).eq('id', existing.id)
  } else {
    await supabase.from('concept_mastery').insert({
      user_id: userId,
      concept_id: conceptId,
      attempts: 1,
      correct: isCorrect ? 1 : 0,
      last_seen: now.toISOString(),
      next_review: nextReview.toISOString(),
      ease_factor: next.ease,
      interval_days: next.interval,
      repetitions: next.reps,
      novel_attempts: isNovel ? 1 : 0,
      novel_correct: isNovel && isCorrect ? 1 : 0,
      ...confidenceDelta,
    })
  }

  return { priorAccuracy }
}
