// Pure readiness-formula math — no Supabase calls. See readinessServer.ts for the
// DB-fetching wrapper. Kept separate so the formula itself can be reasoned about (and
// later unit-tested) independently of how the data gets fetched.

/** Wilson lower bound — a conservative estimate of a true success rate that accounts
 *  for sample size, so a concept answered correctly 2/2 times doesn't score as "100%
 *  mastered" the same way 40/40 would. Never trust a raw ratio on a small n. */
export function wilsonLowerBound(correct: number, attempts: number, z = 1.96): number {
  if (attempts === 0) return 0.5
  const n = attempts
  const phat = correct / n
  const denominator = 1 + (z * z) / n
  const centre = phat + (z * z) / (2 * n)
  const margin = z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n)
  return Math.max(0, Math.min(1, (centre - margin) / denominator))
}

export interface ConceptMasteryForReadiness {
  concept_id: string
  concept_name: string
  attempts: number
  correct: number
  novel_attempts: number
  novel_correct: number
  next_review: string | null
  confident_correct: number
  confident_wrong: number
  guess_correct: number
  guess_wrong: number
  importance?: number // reserved for future ACS-blueprint weighting; defaults to 1
}

export interface RecentExam {
  score: number
  totalQuestions: number
  completedAt: string
}

export interface ReadinessResult {
  score: number | null
  components: {
    conceptMastery: number | null
    novelPerformance: number | null
    retention: number | null
    examPerformance: number | null
    calibration: number | null
  }
  biggestRisks: { conceptId: string; conceptName: string; masteryPct: number }[]
}

const WEIGHTS = {
  conceptMastery: 0.35,
  novelPerformance: 0.25,
  retention: 0.15,
  examPerformance: 0.15,
  calibration: 0.10,
}

/**
 * Computes readiness 0-100 from whatever components have enough data — missing
 * components (e.g. no novel attempts yet, no exam taken) are excluded and their
 * weight is redistributed across the components that do have data, rather than
 * zeroing them out and unfairly punishing a new user. Returns null only when there is
 * truly no data at all (concept_mastery is empty).
 */
export function computeReadiness(mastery: ConceptMasteryForReadiness[], recentExam: RecentExam | null, now: Date): ReadinessResult {
  const attempted = mastery.filter(m => m.attempts > 0)

  const components: ReadinessResult['components'] = {
    conceptMastery: null,
    novelPerformance: null,
    retention: null,
    examPerformance: null,
    calibration: null,
  }

  if (attempted.length > 0) {
    const weightedSum = attempted.reduce((s, m) => s + wilsonLowerBound(m.correct, m.attempts) * (m.importance ?? 1), 0)
    const weightTotal = attempted.reduce((s, m) => s + (m.importance ?? 1), 0)
    components.conceptMastery = (weightedSum / weightTotal) * 100
  }

  const novelQualified = attempted.filter(m => m.novel_attempts >= 3)
  if (novelQualified.length > 0) {
    components.novelPerformance = (novelQualified.reduce((s, m) => s + wilsonLowerBound(m.novel_correct, m.novel_attempts), 0) / novelQualified.length) * 100
  }

  const everReviewed = mastery.filter(m => m.next_review)
  const overdue = everReviewed.filter(m => new Date(m.next_review!).getTime() <= now.getTime())
  if (everReviewed.length > 0) {
    const avgPenalty = everReviewed.reduce((s, m) => {
      const overdueMs = now.getTime() - new Date(m.next_review!).getTime()
      const overdueDays = Math.max(0, overdueMs / (24 * 60 * 60 * 1000))
      return s + Math.min(1, overdueDays / 14)
    }, 0) / everReviewed.length
    components.retention = (1 - avgPenalty) * 100
  }

  if (recentExam && recentExam.totalQuestions > 0) {
    const examAccuracy = (recentExam.score / recentExam.totalQuestions) * 100
    const daysSince = Math.max(0, (now.getTime() - new Date(recentExam.completedAt).getTime()) / (24 * 60 * 60 * 1000))
    const decay = Math.min(1, daysSince / 14)
    components.examPerformance = examAccuracy * (1 - decay) + 50 * decay
  }

  const confidentTotal = attempted.reduce((s, m) => s + m.confident_correct + m.confident_wrong, 0)
  const guessTotal = attempted.reduce((s, m) => s + m.guess_correct + m.guess_wrong, 0)
  const confidentWrongTotal = attempted.reduce((s, m) => s + m.confident_wrong, 0)
  const guessCorrectTotal = attempted.reduce((s, m) => s + m.guess_correct, 0)
  const confidentTerm = confidentTotal > 0 ? 100 * (1 - confidentWrongTotal / confidentTotal) : null
  const guessTerm = guessTotal > 0 ? 100 * (guessCorrectTotal / guessTotal) : null
  if (confidentTerm != null || guessTerm != null) {
    const terms = [confidentTerm, guessTerm].filter((t): t is number => t != null)
    components.calibration = terms.reduce((s, t) => s + t, 0) / terms.length
  }

  const weighted: { weight: number; value: number }[] = []
  if (components.conceptMastery != null) weighted.push({ weight: WEIGHTS.conceptMastery, value: components.conceptMastery })
  if (components.novelPerformance != null) weighted.push({ weight: WEIGHTS.novelPerformance, value: components.novelPerformance })
  if (components.retention != null) weighted.push({ weight: WEIGHTS.retention, value: components.retention })
  if (components.examPerformance != null) weighted.push({ weight: WEIGHTS.examPerformance, value: components.examPerformance })
  if (components.calibration != null) weighted.push({ weight: WEIGHTS.calibration, value: components.calibration })

  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0)
  const score = totalWeight > 0 ? Math.round(weighted.reduce((s, w) => s + w.weight * w.value, 0) / totalWeight) : null

  const biggestRisks = [...attempted]
    .map(m => ({ conceptId: m.concept_id, conceptName: m.concept_name, masteryPct: wilsonLowerBound(m.correct, m.attempts) * 100 * (m.importance ?? 1) }))
    .sort((a, b) => a.masteryPct - b.masteryPct)
    .slice(0, 3)

  return { score, components, biggestRisks }
}
