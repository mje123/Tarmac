// Shared SM-2-style interval scheduler. Originally lived only in api/srs/review —
// generalized here so concept-level mastery scheduling (api/sessions/answer) uses the
// same adaptive-interval logic instead of a separate fixed 1/3-day offset.
export interface IntervalState {
  interval: number
  ease: number
  reps: number
}

// Ease is uncapped-growth-only in vanilla SM-2 because its quality score (0-5) can
// also pull ease down on a weak-but-correct recall. We only have binary correct/
// incorrect, so without an explicit ceiling and a decrease-on-failure path, ease only
// ever climbed — a concept answered correctly a handful of times early on would keep
// compounding its review interval for years with nothing to ever pull it back toward
// "due," even after later mistakes on the same concept.
const MAX_EASE = 2.8
const MAX_INTERVAL_DAYS = 180

export function computeNextInterval(
  repetitions: number,
  intervalDays: number,
  easeFactor: number,
  correct: boolean
): IntervalState {
  if (!correct) {
    const ease = Math.max(1.3, easeFactor - 0.2)
    return { interval: 1, ease, reps: 0 }
  }
  const rawInterval = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.round(intervalDays * easeFactor)
  const interval = Math.min(MAX_INTERVAL_DAYS, rawInterval)
  const ease = Math.min(MAX_EASE, Math.max(1.3, easeFactor + 0.1))
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
  // A wrong answer given with real confidence (but not enough concept history to call
  // it a calibration slip) is the one case that plausibly reads as "fell for a
  // specific trap" rather than "didn't know it" — still just a heuristic guess, so it
  // stays a distinct tag rather than defaulting to concept_gap.
  if (veryConfident || somewhatConfident) return 'distractor_trap'
  // Wrong AND unsure/guessing — this used to unconditionally land on 'distractor_trap'
  // too, which reads backwards (a distractor trap is supposed to look right enough to
  // fool someone, not to be missed by a guess) and, worse, permanently skipped the
  // AI-refinement queue below (only 'concept_gap' answers get queued). Defaulting to
  // 'concept_gap' here means an honest "I didn't know" gets classified as exactly that,
  // and gets a real shot at being refined into figure_misread/misread_question/
  // transfer_failure instead of sitting mislabeled forever.
  return 'concept_gap'
}
