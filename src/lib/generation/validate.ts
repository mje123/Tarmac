import Anthropic from '@anthropic-ai/sdk'
import type { GeneratedQuestionCandidate } from './generate'
import type { ConceptDefinition } from './concepts'
import { checkNovelty, type NoveltyCheckInput } from './novelty'

export const JUDGE_MODEL = 'claude-haiku-4-5-20251001'

export type ValidationFailureReason =
  | 'structural'
  | 'numeric_mismatch'
  | 'duplicate_wording'
  | 'ambiguous_or_multiple_correct'
  | 'implausible_distractor'
  | 'judge_error'

export interface ValidationResult {
  approved: boolean
  reason?: ValidationFailureReason
  detail?: string
  noveltyKey?: string
}

function structuralCheck(candidate: GeneratedQuestionCandidate): ValidationResult | null {
  const options = [candidate.option_a, candidate.option_b, candidate.option_c]
  if (options.some(o => !o || o.trim().length === 0)) {
    return { approved: false, reason: 'structural', detail: 'One or more answer options is empty' }
  }
  const unique = new Set(options.map(o => o.trim().toLowerCase()))
  if (unique.size !== options.length) {
    return { approved: false, reason: 'structural', detail: 'Two answer options are identical' }
  }
  if (!['A', 'B', 'C'].includes(candidate.correct_answer)) {
    return { approved: false, reason: 'structural', detail: `correct_answer "${candidate.correct_answer}" is not A/B/C` }
  }
  if (!candidate.question_text || candidate.question_text.trim().length < 15) {
    return { approved: false, reason: 'structural', detail: 'Question text missing or too short' }
  }
  if (!candidate.explanation || candidate.explanation.trim().length < 10) {
    return { approved: false, reason: 'structural', detail: 'Explanation missing or too short' }
  }
  return null
}

/** Generic numeric validation — looks up the concept's own compute function rather
 *  than special-casing any one concept, so every calculation-archetype concept
 *  (density altitude, weight & balance, load factor, etc.) gets the same independent
 *  arithmetic check: the LLM's claimed value is never trusted on its own. */
function numericCheck(candidate: GeneratedQuestionCandidate, concept: ConceptDefinition): ValidationResult | null {
  if (!concept.numeric) return null
  if (candidate.claimed_numeric_value == null || !candidate.calculation_inputs) return null // not a calculation archetype

  const missingField = concept.numeric.inputFields.find(f => typeof candidate.calculation_inputs![f.key] !== 'number')
  if (missingField) {
    return { approved: false, reason: 'structural', detail: `Missing or non-numeric calculation_inputs.${missingField.key}` }
  }

  const expected = concept.numeric.compute(candidate.calculation_inputs)
  const diff = Math.abs(candidate.claimed_numeric_value - expected)

  if (diff > concept.numeric.tolerance) {
    return {
      approved: false,
      reason: 'numeric_mismatch',
      detail: `Claimed ${candidate.claimed_numeric_value} ${concept.numeric.unit} vs. deterministically computed ${Math.round(expected * 100) / 100} ${concept.numeric.unit} (diff ${Math.round(diff * 100) / 100})`,
    }
  }
  return null
}

/** Cheap self-critique pass using a different model than the generator, per the
 *  spec's requirement that ambiguity/distractor checks not simply trust the
 *  generator's own output. */
async function judgeCheck(candidate: GeneratedQuestionCandidate, concept: ConceptDefinition): Promise<ValidationResult | null> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const prompt = `You are a strict FAA written-test question reviewer. Evaluate this candidate question against the verified rule it must be grounded in.

VERIFIED RULE: ${concept.ruleSummary}

QUESTION: ${candidate.question_text}
A. ${candidate.option_a}
B. ${candidate.option_b}
C. ${candidate.option_c}
Marked correct: ${candidate.correct_answer}

Check for:
1. Exactly one option is defensibly correct per the verified rule (no two options could both be argued correct).
2. The question is not ambiguous — a knowledgeable pilot would not read it two different legitimate ways.
3. Both wrong options are plausible (not obviously silly) and are actually wrong per the verified rule.
4. Nothing in the question or options contradicts the verified rule.

Return ONLY JSON: { "pass": true } or { "pass": false, "reason": "short reason" }`

  const response = await anthropic.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return { approved: false, reason: 'judge_error', detail: 'Judge returned no parseable JSON' }

  const result = JSON.parse(match[0]) as { pass: boolean; reason?: string }
  if (!result.pass) {
    return { approved: false, reason: 'ambiguous_or_multiple_correct', detail: result.reason || 'Judge rejected without a reason' }
  }
  return null
}

export interface ValidationInput {
  candidate: GeneratedQuestionCandidate
  concept: ConceptDefinition
  scenarioType: string
  recentQuestions: NoveltyCheckInput['recentQuestions']
}

/**
 * Runs the full validation pipeline in cheapest-first order (structural → numeric →
 * novelty are all free/local; the judge LLM call only runs if everything else passes).
 * Returns approved:false with a reason on the FIRST failure — the caller should log
 * it and generate another candidate rather than show it to a student.
 */
export async function validateCandidate(input: ValidationInput): Promise<ValidationResult> {
  const { candidate, concept, scenarioType, recentQuestions } = input

  const structural = structuralCheck(candidate)
  if (structural) return structural

  const numeric = numericCheck(candidate, concept)
  if (numeric) return numeric

  const novelty = checkNovelty({
    conceptId: concept.slug, // stable key for the pilot; swapped for the real concept UUID at call sites once the row exists
    scenarioType,
    questionText: candidate.question_text,
    correctAnswerPosition: candidate.correct_answer,
    recentQuestions,
  })
  if (!novelty.novel) {
    return {
      approved: false,
      reason: 'duplicate_wording',
      detail: `Similarity ${novelty.maxSimilarity.toFixed(2)} to a recent question on this concept/archetype exceeds threshold`,
      noveltyKey: novelty.noveltyKey,
    }
  }

  const judged = await judgeCheck(candidate, concept)
  if (judged) return judged

  return { approved: true, noveltyKey: novelty.noveltyKey }
}
