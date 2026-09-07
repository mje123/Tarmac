import type { SupabaseClient } from '@supabase/supabase-js'

export interface NovelCheckQuestion {
  concept_id: string | null
  archetype_id: string | null
  cognitive_level: string | null
  novelty_key: string | null
}

/**
 * A served question counts as "novel" for this student — for Novel Question
 * Performance tracking and readiness weighting — if any of:
 *   1. First-ever exposure to this archetype (scenario shape) for this user, OR
 *   2. cognitive_level = 'transfer' (transfer questions are novel-by-design), OR
 *   3. Its novelty_key differs from every novelty_key the user has seen for this
 *      concept in their last 15 answers on it (mirrors the generation-time
 *      checkNovelty() contract in generation/novelty.ts, applied retrospectively).
 *
 * Only meaningful for validated-pipeline questions (concept_id set) — legacy bank
 * questions have no archetype/novelty_key to measure this against and are never novel
 * for this purpose. No AI call — uses columns already written at generation time.
 */
export async function isQuestionNovelForUser(
  supabase: SupabaseClient,
  sessionIds: string[],
  question: NovelCheckQuestion
): Promise<boolean> {
  if (!question.concept_id) return false
  if (question.cognitive_level === 'transfer') return true
  if (sessionIds.length === 0) return true

  if (question.archetype_id) {
    const { count } = await supabase
      .from('test_answers')
      .select('id, questions!inner(archetype_id)', { count: 'exact', head: true })
      .in('session_id', sessionIds)
      .eq('questions.archetype_id', question.archetype_id)
    if ((count ?? 0) === 0) return true
  }

  if (question.novelty_key) {
    const { data: recent } = await supabase
      .from('test_answers')
      .select('answered_at, questions!inner(concept_id, novelty_key)')
      .in('session_id', sessionIds)
      .eq('questions.concept_id', question.concept_id)
      .order('answered_at', { ascending: false })
      .limit(15)

    const seenKeys = new Set(
      (recent || [])
        .map(r => (r as unknown as { questions: { novelty_key: string | null } }).questions?.novelty_key)
        .filter((k): k is string => !!k)
    )
    if (!seenKeys.has(question.novelty_key)) return true
  }

  return false
}
