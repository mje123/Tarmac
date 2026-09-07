// Pure runway logic — no Supabase calls here, so phase math and daily-plan assembly
// can be reasoned about (and unit-tested later) independently of the DB. Callers
// (api/runway) own fetching concept_mastery and persisting the result.

export type RunwayPhase = 'diagnose' | 'build' | 'apply' | 'transfer' | 'simulate' | 'remediate' | 'prove_it'

// Phase boundaries as fractions of a 30-day runway (Days 1-3 Diagnose, 4-10 Build,
// 11-17 Apply, 18-23 Transfer, 24-27 Simulate, 28-29 Remediate, 30 Prove It). A
// shorter runway (real exam date < 30 days out) scales these fractions down rather
// than dropping phases — every user passes through the same shape, compressed.
const PHASE_FRACTIONS: { phase: RunwayPhase; endFraction: number }[] = [
  { phase: 'diagnose', endFraction: 3 / 30 },
  { phase: 'build', endFraction: 10 / 30 },
  { phase: 'apply', endFraction: 17 / 30 },
  { phase: 'transfer', endFraction: 23 / 30 },
  { phase: 'simulate', endFraction: 27 / 30 },
  { phase: 'remediate', endFraction: 29 / 30 },
  { phase: 'prove_it', endFraction: 1 },
]

export interface RunwayState {
  dayIndex: number
  totalDays: number
  phase: RunwayPhase
  compressed: boolean
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000))
}

/** Computes today's day-in-plan and phase from stored state + wall-clock time. Always
 *  recomputed live (never trusted as stored truth) so a user who doesn't visit for a
 *  few days lands on the correct phase immediately, not a stale one. */
export function computeRunwayState(planStartedAt: Date, examDate: Date | null, now: Date): RunwayState {
  const planLengthToExam = examDate ? daysBetween(planStartedAt, examDate) + 1 : null
  const totalDays = planLengthToExam != null ? Math.max(3, Math.min(30, planLengthToExam)) : 30
  const compressed = totalDays < 30

  const rawDayIndex = daysBetween(planStartedAt, now) + 1
  const dayIndex = Math.max(1, Math.min(totalDays, rawDayIndex))
  const fraction = dayIndex / totalDays

  const match = PHASE_FRACTIONS.find(p => fraction <= p.endFraction) ?? PHASE_FRACTIONS[PHASE_FRACTIONS.length - 1]

  return { dayIndex, totalDays, phase: match.phase, compressed }
}

export interface ConceptMasterySnapshot {
  concept_id: string
  concept_name: string
  attempts: number
  correct: number
  novel_attempts: number
  novel_correct: number
  next_review: string | null
}

export interface DailyPlanItem {
  mode: 'learn' | 'practice' | 'transfer' | 'weakness' | 'exam'
  conceptIds: string[]
  targetCognitiveLevel: string | null
  estimatedMinutes: number
  label: string
}

/** Assembles today's recommended session from the current phase + the user's
 *  concept-mastery snapshot. Deliberately simple, deterministic rules — no AI call —
 *  the AI's job is question generation, not deciding what today's plan should be. */
export function generateDailyPlan(phase: RunwayPhase, mastery: ConceptMasterySnapshot[]): DailyPlanItem {
  const attempted = mastery.filter(m => m.attempts > 0)
  const weakest = [...attempted].sort((a, b) => (a.correct / a.attempts) - (b.correct / b.attempts))
  const due = mastery.filter(m => m.next_review && new Date(m.next_review) <= new Date())
  const weakestIds = weakest.slice(0, 3).map(m => m.concept_id)
  const dueIds = due.slice(0, 5).map(m => m.concept_id)

  switch (phase) {
    case 'diagnose':
      return { mode: 'practice', conceptIds: [], targetCognitiveLevel: 'recall', estimatedMinutes: 12, label: 'Diagnostic — mixed concepts, see where you stand' }
    case 'build':
      return { mode: 'learn', conceptIds: weakestIds, targetCognitiveLevel: 'application', estimatedMinutes: 15, label: 'Build the concepts you\'re weakest in' }
    case 'apply':
      return { mode: 'practice', conceptIds: dueIds.length > 0 ? dueIds : weakestIds, targetCognitiveLevel: 'scenario', estimatedMinutes: 18, label: 'Apply what you\'ve built, mixed with due reviews' }
    case 'transfer':
      return { mode: 'transfer', conceptIds: [], targetCognitiveLevel: 'transfer', estimatedMinutes: 15, label: 'Transfer — questions you haven\'t seen before' }
    case 'simulate':
      return { mode: 'exam', conceptIds: [], targetCognitiveLevel: null, estimatedMinutes: 150, label: 'Full timed simulated exam' }
    case 'remediate':
      return { mode: 'weakness', conceptIds: weakestIds, targetCognitiveLevel: null, estimatedMinutes: 10, label: 'Attack what the simulated exam exposed' }
    case 'prove_it':
      return { mode: 'exam', conceptIds: [], targetCognitiveLevel: null, estimatedMinutes: 150, label: 'Prove it — final full exam' }
  }
}

export const PHASE_LABELS: Record<RunwayPhase, string> = {
  diagnose: 'Diagnose',
  build: 'Build',
  apply: 'Apply',
  transfer: 'Transfer',
  simulate: 'Simulate',
  remediate: 'Remediate',
  prove_it: 'Prove It',
}

/** The session-description label is a pure function of phase alone (see
 *  generateDailyPlan's switch) — exposed separately so callers displaying an
 *  already-persisted daily_plan_items row (which doesn't store label) don't need to
 *  re-run mastery-dependent plan generation just to redisplay static copy. */
export const PHASE_SESSION_LABELS: Record<RunwayPhase, string> = {
  diagnose: 'Diagnostic — mixed concepts, see where you stand',
  build: 'Build the concepts you\'re weakest in',
  apply: 'Apply what you\'ve built, mixed with due reviews',
  transfer: 'Transfer — questions you haven\'t seen before',
  simulate: 'Full timed simulated exam',
  remediate: 'Attack what the simulated exam exposed',
  prove_it: 'Prove it — final full exam',
}
