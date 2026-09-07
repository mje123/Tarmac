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

/** Full 9-category error taxonomy. Only the first 6 are ever set by the heuristic
 *  below; the last 3 require real semantic judgment and are only ever written by the
 *  async AI refinement pass (see pending_error_classifications / cron/classify-errors),
 *  which also may confirm or override 'concept_gap'. */
export type ErrorTag =
  | 'concept_gap'
  | 'calculation_error'
  | 'distractor_trap'
  | 'regulation_confusion'
  | 'careless_error'
  | 'confidence_error'
  | 'figure_misread'
  | 'misread_question'
  | 'transfer_failure'

/** Lightweight error classification derived entirely from data already on hand
 *  (scenario type, category, stated confidence, and prior accuracy on this concept) —
 *  no extra AI call. Six of the nine categories are reachable this way; the remaining
 *  three (figure_misread, misread_question, transfer_failure) need real judgment and
 *  are left to the async AI refinement pass, which only runs on answers this function
 *  bucketed as the catch-all 'concept_gap'. */
export function classifyError(opts: {
  isCorrect: boolean
  scenarioType: string | null
  confidence: ConfidenceLevel | null
  category?: string | null
  /** correct/attempts on this concept BEFORE this answer, or null if there's no prior
   *  history — lets a wrong answer on an otherwise-strong concept be told apart from a
   *  genuine gap. */
  priorAccuracy?: number | null
}): ErrorTag | null {
  if (opts.isCorrect) return null
  if (opts.scenarioType === 'calculation') return 'calculation_error'
  if (opts.category && /regulation/i.test(opts.category)) return 'regulation_confusion'

  const veryConfident = opts.confidence === 'very_confident'
  const somewhatConfident = opts.confidence === 'somewhat_confident'
  const strongHistory = opts.priorAccuracy != null && opts.priorAccuracy >= 0.8
  const solidHistory = opts.priorAccuracy != null && opts.priorAccuracy >= 0.7

  // Confident-and-wrong on a concept the student otherwise handles well reads as a
  // calibration slip, not a knowledge gap — this is the one distinction the heuristic
  // can draw reliably without AI help.
  if (veryConfident && strongHistory) return 'confidence_error'
  if (somewhatConfident && solidHistory) return 'careless_error'
  if (veryConfident || somewhatConfident) return 'concept_gap'
  return 'distractor_trap'
}
