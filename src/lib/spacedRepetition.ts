// Shared SM-2-style interval scheduler. Originally lived only in api/srs/review —
// generalized here so concept-level mastery scheduling (api/sessions/answer) uses the
// same adaptive-interval logic instead of a separate fixed 1/3-day offset.
export interface IntervalState {
  interval: number
  ease: number
  reps: number
}

export function computeNextInterval(
  repetitions: number,
  intervalDays: number,
  easeFactor: number,
  correct: boolean
): IntervalState {
  if (!correct) return { interval: 1, ease: easeFactor, reps: 0 }
  const interval = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.round(intervalDays * easeFactor)
  const ease = Math.max(1.3, easeFactor + 0.1)
  return { interval, ease, reps: repetitions + 1 }
}

export type ConfidenceLevel = 'very_confident' | 'somewhat_confident' | 'unsure' | 'guessing'

/** Lightweight error classification derived entirely from data already on hand
 *  (archetype scenario type + the student's stated confidence) — no extra AI call.
 *  This is deliberately a coarse 3-bucket heuristic, not the full spec's 9-category
 *  AI-judged taxonomy (deferred to a later phase). */
export function classifyError(opts: {
  isCorrect: boolean
  scenarioType: string | null
  confidence: ConfidenceLevel | null
}): 'concept_gap' | 'calculation_error' | 'distractor_trap' | null {
  if (opts.isCorrect) return null
  if (opts.scenarioType === 'calculation') return 'calculation_error'
  if (opts.confidence === 'very_confident' || opts.confidence === 'somewhat_confident') return 'concept_gap'
  return 'distractor_trap'
}
