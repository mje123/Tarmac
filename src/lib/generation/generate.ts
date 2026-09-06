import Anthropic from '@anthropic-ai/sdk'
import type { ConceptArchetype, ConceptDefinition } from './concepts'

export const GENERATOR_MODEL = 'claude-sonnet-4-6'
export const PROMPT_VERSION = 'v1-concept-grounded'

export interface GeneratedQuestionCandidate {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  correct_answer: 'A' | 'B' | 'C'
  distractor_rationale: string
  explanation: string
  common_trap: string
  claimed_numeric_value?: number // present only for calculation archetypes — checked against concept.numeric.compute
  calculation_inputs?: Record<string, number> // keyed by concept.numeric.inputFields[].key
}

/**
 * Generates ONE candidate question. The model receives the concept's verified
 * rule_summary as ground truth and is instructed to vary presentation, not invent
 * aviation facts. The candidate is untrusted until it passes validate.ts.
 */
export async function generateCandidate(
  concept: ConceptDefinition,
  archetype: ConceptArchetype
): Promise<GeneratedQuestionCandidate> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const isCalculation = archetype.scenarioType === 'calculation' && !!concept.numeric

  const numericFieldsJson = isCalculation
    ? concept.numeric!.inputFields.map(f => `"${f.key}": 0`).join(', ')
    : ''
  const numericFieldsList = isCalculation
    ? concept.numeric!.inputFields.map(f => f.label).join(', ')
    : ''

  const prompt = `You are generating ONE FAA-style ${concept.examType === 'ifr' ? 'Instrument Rating' : 'Private Pilot'} written-test practice question for the concept below.

CONCEPT: ${concept.name}
VERIFIED RULE (this is the ONLY source of truth — do not add, alter, or contradict any fact in it):
${concept.ruleSummary}

COMMON MISCONCEPTIONS TO USE AS DISTRACTOR MATERIAL (not as correct-answer content):
${concept.commonMisconceptions}

QUESTION ARCHETYPE: ${archetype.scenarioType} (cognitive level: ${archetype.cognitiveLevel})
${archetype.templatePrompt}

STRICT RULES:
1. Exactly 3 answer options (A, B, C). Only ONE is correct.
2. Every fact in the question and every option must follow strictly from the VERIFIED RULE above — do not invent regulations, numbers, or aeronautical facts not implied by it.
3. Distractors must reflect the COMMON MISCONCEPTIONS above or another realistic, plausible-but-wrong reasoning path — not arbitrary filler.
4. Use natural scenario details (aircraft type, airport, weather) but keep any numeric values realistic and FAA-test-appropriate.
${isCalculation ? `5. Because this is a calculation archetype, you MUST include "calculation_inputs" — the exact ${numericFieldsList} you used in the scenario — and "claimed_numeric_value", the ${concept.name.toLowerCase()} result (in ${concept.numeric!.unit}) your explanation relies on. These will be independently recalculated; if they don't match your explanation, the question is rejected.` : ''}

Return ONLY valid JSON, no markdown, no commentary:
{
  "question_text": "...",
  "option_a": "...",
  "option_b": "...",
  "option_c": "...",
  "correct_answer": "A",
  "distractor_rationale": "1-2 sentences on why each wrong option is a plausible mistake, not why the correct one is right",
  "explanation": "2-4 sentences explaining why the correct answer is right, referencing the rule",
  "common_trap": "1 sentence on the most common way a student gets this wrong"${isCalculation ? `,\n  "claimed_numeric_value": 0000,\n  "calculation_inputs": { ${numericFieldsJson} }` : ''}
}`

  const response = await anthropic.messages.create({
    model: GENERATOR_MODEL,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Generator returned no JSON object')

  return JSON.parse(match[0]) as GeneratedQuestionCandidate
}
