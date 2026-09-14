// Deterministic-first validation pipeline (spec section 5). Cheap, local, code-only
// checks run before any semantic LLM call — a candidate that fails structurally or
// numerically never needs a judge call at all. Every check maps to a specific spec
// requirement; see the comment above each function.

import type { GeneratedQuestionStructured, SemanticValidationResult } from './schema'
import type { QuestionBlueprint } from './blueprint'
import type { AIProvider, ValidateQuestionResult } from './providers/types'
import { checkNovelty } from '../generation/novelty'
import { hasUnservableFigureReference } from '../figures'

export type ValidationFailureReason =
  | 'structural'
  | 'exam_mismatch'
  | 'numeric_mismatch'
  | 'duplicate_wording'
  | 'figure_unavailable'
  | 'source_invalid'
  | 'ambiguous_or_multiple_correct'
  | 'distractor_invalid'
  | 'regulatory_inconsistent'
  | 'acs_mismatch'
  | 'scenario_inconsistent'
  | 'judge_error'

export interface ValidationOutcome {
  approved: boolean
  reason?: ValidationFailureReason
  detail?: string
  noveltyKey?: string
  semanticValidation?: SemanticValidationResult
  semanticCall?: ValidateQuestionResult
}

// --- 1. Structural validation (spec 5: Answer validation, part 1) -------------------
function structuralCheck(candidate: GeneratedQuestionStructured, blueprint: QuestionBlueprint): ValidationOutcome | null {
  const { A, B, C } = candidate.choices || {}
  const options = [A, B, C]
  if (options.some(o => !o || o.trim().length === 0)) {
    return { approved: false, reason: 'structural', detail: 'One or more answer choices is empty' }
  }
  const unique = new Set(options.map(o => o.trim().toLowerCase()))
  if (unique.size !== options.length) {
    return { approved: false, reason: 'structural', detail: 'Two answer choices are identical' }
  }
  if (!['A', 'B', 'C'].includes(candidate.correct_answer)) {
    return { approved: false, reason: 'structural', detail: `correct_answer "${candidate.correct_answer}" is not A/B/C` }
  }
  if (!candidate.question || candidate.question.trim().length < 15) {
    return { approved: false, reason: 'structural', detail: 'Question text missing or too short' }
  }
  if (!candidate.explanation || candidate.explanation.trim().length < 10) {
    return { approved: false, reason: 'structural', detail: 'Explanation missing or too short' }
  }
  if (candidate.exam !== blueprint.exam) {
    return { approved: false, reason: 'exam_mismatch', detail: `Blueprint specified exam "${blueprint.exam}" but candidate returned "${candidate.exam}"` }
  }
  return null
}

// --- 2. Figure validation (spec 5 + 11: never serve an unservable figure claim) -----
// SERVABLE_FIGURE_TYPES lists figure types with a real generator in src/lib/figures —
// keep this in sync with generators.ts's getFigureGenerator(). Everything else still
// falls through to the reject-and-hold path below; this pipeline never fabricates a
// chart/figure it can't actually produce. Note: the standalone VOR generation script
// (scripts/generate-vor-questions.mts) doesn't route through this pipeline at all — it
// derives the question from a locked scenario object and inserts directly. This gate
// exists for the day a concept's blueprint sets figureRequired for a servable type and
// the model claims one back, at which point this must not auto-reject a real figure.
const SERVABLE_FIGURE_TYPES = ['vor_navigation', 'instrument_panel']

function figureCheck(candidate: GeneratedQuestionStructured): ValidationOutcome | null {
  if (!candidate.figure_required) return null
  if (candidate.figure_type && SERVABLE_FIGURE_TYPES.includes(candidate.figure_type)) return null
  // No generator exists for this figure type yet (see src/lib/figures/generators.ts).
  // A model claiming one is needed anyway must be held, never approved and never given
  // a fabricated chart.
  return {
    approved: false,
    reason: 'figure_unavailable',
    detail: `Candidate claims a figure is required (${candidate.figure_type ?? 'unspecified type'}, ${candidate.figure_source ?? 'no source given'}) but no figure generator exists for that type — held for review, not approved.`,
  }
}
// Also reuses the existing text-pattern check, in case a candidate references a figure
// in its prose without setting figure_required=true.
function unservableFigureReferenceCheck(candidate: GeneratedQuestionStructured): ValidationOutcome | null {
  if (!hasUnservableFigureReference(candidate.question)) return null
  return { approved: false, reason: 'figure_unavailable', detail: 'Question text references a figure/chart with no backing image on file.' }
}

// --- 3. Numerical validation (spec 5: never trust LLM arithmetic) ------------------
function numericCheck(candidate: GeneratedQuestionStructured, blueprint: QuestionBlueprint): ValidationOutcome | null {
  if (!blueprint.numeric) return null
  if (candidate.claimed_numeric_value == null || !candidate.calculation_inputs) return null // not a calculation archetype

  const missingField = blueprint.numeric.inputFields.find(f => typeof candidate.calculation_inputs![f.key] !== 'number')
  if (missingField) {
    return { approved: false, reason: 'structural', detail: `Missing or non-numeric calculation_inputs.${missingField.key}` }
  }

  const expected = blueprint.numeric.compute(candidate.calculation_inputs)
  const diff = Math.abs(candidate.claimed_numeric_value - expected)
  if (diff > blueprint.numeric.tolerance) {
    return {
      approved: false,
      reason: 'numeric_mismatch',
      detail: `Claimed ${candidate.claimed_numeric_value} ${blueprint.numeric.unit} vs. deterministically computed ${Math.round(expected * 100) / 100} ${blueprint.numeric.unit} (diff ${Math.round(diff * 100) / 100})`,
    }
  }
  return null
}

// --- 4. Novelty validation (spec 6) -------------------------------------------------
export interface RecentQuestionRow { concept_id: string | null; scenario_type: string | null; question_text: string; correct_answer: string }

function noveltyCheck(candidate: GeneratedQuestionStructured, blueprint: QuestionBlueprint, recentQuestions: RecentQuestionRow[]) {
  return checkNovelty({
    conceptId: blueprint.conceptId,
    scenarioType: blueprint.scenarioType,
    questionText: candidate.question,
    correctAnswerPosition: candidate.correct_answer,
    recentQuestions,
  })
}

// --- 5-9. Semantic validation (spec 5: source/answer/regulatory/ambiguity/distractor/
// ACS/scenario) — one structured judge call, run by whichever provider generated the
// candidate. See prompts.ts's buildSemanticValidationPrompt for exactly what's checked.
async function semanticCheck(
  provider: AIProvider,
  candidate: GeneratedQuestionStructured,
  blueprint: QuestionBlueprint
): Promise<{ outcome: ValidationOutcome | null; call: ValidateQuestionResult }> {
  const call = await provider.validateQuestion(candidate, blueprint)
  const r = call.result
  if (r.pass) return { outcome: null, call }

  const reason: ValidationFailureReason = !r.source_valid ? 'source_invalid'
    : !r.exactly_one_correct ? 'ambiguous_or_multiple_correct'
    : !r.distractors_valid ? 'distractor_invalid'
    : !r.regulatory_consistent ? 'regulatory_inconsistent'
    : !r.not_ambiguous ? 'ambiguous_or_multiple_correct'
    : !r.matches_acs_task ? 'acs_mismatch'
    : !r.scenario_consistent ? 'scenario_inconsistent'
    : 'judge_error'

  return { outcome: { approved: false, reason, detail: r.reason, semanticValidation: r }, call }
}

export interface ValidateCandidateInput {
  candidate: GeneratedQuestionStructured
  blueprint: QuestionBlueprint
  provider: AIProvider
  recentQuestions: RecentQuestionRow[]
}

/**
 * Full pipeline, cheapest-first: structural -> exam match -> figure -> numeric ->
 * novelty (all free/local) -> semantic judge (the only paid call, so it only runs once
 * everything free has already passed). Returns on the FIRST failure. The semantic call
 * result is attached whenever it actually ran, so the caller can log it even on
 * rejection (spec section 10 — every attempt must be traceable).
 */
export async function validateCandidate(input: ValidateCandidateInput): Promise<ValidationOutcome> {
  const { candidate, blueprint, provider, recentQuestions } = input

  const structural = structuralCheck(candidate, blueprint)
  if (structural) return structural

  const figure = figureCheck(candidate) || unservableFigureReferenceCheck(candidate)
  if (figure) return figure

  const numeric = numericCheck(candidate, blueprint)
  if (numeric) return numeric

  const novelty = noveltyCheck(candidate, blueprint, recentQuestions)
  if (!novelty.novel) {
    return {
      approved: false,
      reason: 'duplicate_wording',
      detail: `Similarity ${novelty.maxSimilarity.toFixed(2)} to a recent question on this concept/archetype exceeds threshold`,
      noveltyKey: novelty.noveltyKey,
    }
  }

  try {
    const { outcome, call } = await semanticCheck(provider, candidate, blueprint)
    if (outcome) return { ...outcome, noveltyKey: novelty.noveltyKey, semanticCall: call }
    return { approved: true, noveltyKey: novelty.noveltyKey, semanticValidation: call.result, semanticCall: call }
  } catch (err) {
    return { approved: false, reason: 'judge_error', detail: `Semantic validation call failed: ${err instanceof Error ? err.message : String(err)}`, noveltyKey: novelty.noveltyKey }
  }
}
