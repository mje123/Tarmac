import type { SupabaseClient } from '@supabase/supabase-js'
import { computeReadiness, type ConceptMasteryForReadiness, type RecentExam, type ReadinessResult } from './readiness'

type MasteryRow = {
  concept_id: string
  attempts: number
  correct: number
  novel_attempts: number
  novel_correct: number
  next_review: string | null
  confident_correct: number
  confident_wrong: number
  guess_correct: number
  guess_wrong: number
  concepts: { name: string; exam_type: string } | { name: string; exam_type: string }[] | null
}

function conceptOf(row: MasteryRow): { name: string; exam_type: string } | null {
  if (!row.concepts) return null
  return Array.isArray(row.concepts) ? row.concepts[0] ?? null : row.concepts
}

/** Fetches everything computeReadiness() needs for one user/exam-type and returns the
 *  formula result — shared by the Practice Home partial display and the full
 *  readiness breakdown page so both read the same number. */
export async function getReadiness(supabase: SupabaseClient, userId: string, examType: 'ppl' | 'ifr'): Promise<ReadinessResult> {
  const { data: masteryRowsRaw } = await supabase
    .from('concept_mastery')
    .select('concept_id, attempts, correct, novel_attempts, novel_correct, next_review, confident_correct, confident_wrong, guess_correct, guess_wrong, concepts!inner(name, exam_type)')
    .eq('user_id', userId)
    .eq('concepts.exam_type', examType)

  const mastery: ConceptMasteryForReadiness[] = ((masteryRowsRaw || []) as unknown as MasteryRow[])
    .map(r => {
      const concept = conceptOf(r)
      return {
        concept_id: r.concept_id,
        concept_name: concept?.name ?? '',
        attempts: r.attempts,
        correct: r.correct,
        novel_attempts: r.novel_attempts,
        novel_correct: r.novel_correct,
        next_review: r.next_review,
        confident_correct: r.confident_correct,
        confident_wrong: r.confident_wrong,
        guess_correct: r.guess_correct,
        guess_wrong: r.guess_wrong,
      }
    })

  const { data: examRows } = await supabase
    .from('test_sessions')
    .select('score, total_questions, completed_at')
    .eq('user_id', userId)
    .eq('session_type', 'real_exam')
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)

  const recentExam: RecentExam | null = examRows && examRows.length > 0 && examRows[0].score != null && examRows[0].total_questions
    ? { score: examRows[0].score as number, totalQuestions: examRows[0].total_questions as number, completedAt: examRows[0].completed_at as string }
    : null

  return computeReadiness(mastery, recentExam, new Date())
}
