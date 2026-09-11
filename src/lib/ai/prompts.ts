// Shared prompt text — every provider gets the identical brief so a benchmark between
// them measures the model, not a wording difference in the prompt. Keep this the only
// place generation/judge wording is authored; providers only handle transport +
// schema enforcement.

import type { QuestionBlueprint } from './blueprint'
import type { GeneratedQuestionStructured } from './schema'

export const PROMPT_VERSION = 'v2-provider-agnostic-blueprint'

const MODE_INSTRUCTIONS: Record<QuestionBlueprint['mode'], string> = {
  new_question: 'Generate a new question for this concept and archetype.',
  novel_variant: 'Generate a MATERIALLY different question on the same concept — different scenario, numbers, wording, and (if plausible for this archetype) framing than anything in AVOID REPEATING below. Do not just reword one of them.',
  prove_it: 'This is a Prove It check: the student already answered a DIFFERENT reasoning shape correctly. Test the exact same concept through THIS archetype\'s distinct reasoning path — never substitute a different concept even if it seems related.',
  weakness_attack: 'The student is weak on this exact concept. Write a clear, fair test of it — do not pad the question with unrelated difficulty; the goal is an accurate read of whether they now understand this concept, not a harder trick.',
  transfer: 'Apply the same underlying knowledge in a SUBSTANTIALLY different scenario than the concept\'s typical framing (different context, different surface details) while still testing the identical rule.',
}

export function buildGenerationPrompt(blueprint: QuestionBlueprint): string {
  const isCalculation = blueprint.scenarioType === 'calculation' && !!blueprint.numeric
  const numericFieldsList = isCalculation ? blueprint.numeric!.inputFields.map(f => f.label).join(', ') : ''
  const avoidBlock = blueprint.avoidSimilarTo.length > 0
    ? `\nAVOID REPEATING (recent questions already asked on this concept):\n${blueprint.avoidSimilarTo.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
    : ''

  return `You are generating ONE FAA-style ${blueprint.exam === 'ifr' ? 'Instrument Rating' : 'Private Pilot'} written-test practice question.

BLUEPRINT (you must follow this exactly — you do not choose the concept, ACS task, or reasoning shape):
- Exam: ${blueprint.exam}
- ACS area: ${blueprint.acsArea}
- ACS task: ${blueprint.acsTask}
- Concept: ${blueprint.conceptName}
- Authoritative source: ${blueprint.source}
- Archetype (required reasoning path): ${blueprint.scenarioType} — ${blueprint.requiredReasoningPath}
- Cognitive level: ${blueprint.cognitiveLevel}
- Difficulty: ${blueprint.difficulty}
- Generation mode: ${blueprint.mode}

VERIFIED RULE (the ONLY source of truth — do not add, alter, or contradict any fact in it; if you would need information not present here, do not invent it):
${blueprint.ruleSummary}

COMMON MISCONCEPTIONS TO USE AS DISTRACTOR MATERIAL (not as correct-answer content):
${blueprint.commonMisconceptions}

MODE INSTRUCTION: ${MODE_INSTRUCTIONS[blueprint.mode]}
${avoidBlock}
STRICT RULES:
1. Exactly 3 answer choices (A, B, C). Only ONE is correct.
2. Every fact in the scenario and every choice must follow strictly from the VERIFIED RULE above.
3. Distractors must reflect the COMMON MISCONCEPTIONS above or another realistic, plausible-but-wrong reasoning path — not arbitrary filler.
4. "source_reference" must be a specific citation implied by the authoritative source above (e.g. a subsection), never a fabricated one.
5. Set "figure_required" true ONLY if the question genuinely cannot be answered without a chart/figure — if true, also set figure_type, figure_source (the real FAA document/figure it would come from, never invented), and visual_concept (what it would need to show). Prefer false; this concept does not currently have a servable figure, so a true value here will hold the question for review rather than approve it.
6. "variables" must list the specific values you actually used in the scenario (e.g. {"temperature_c": 22, "dewpoint_c": 14}), keyed by names drawn from: ${blueprint.requiredVariables.join(', ')}.
7. "novelty_key" is your own short (5-10 word) description of what makes this instance different from the AVOID REPEATING list, if any.
${isCalculation ? `8. Because this is a calculation archetype, you MUST include "calculation_inputs" (the exact ${numericFieldsList} you used) and "claimed_numeric_value" (the result in ${blueprint.numeric!.unit} your explanation relies on) — these are independently recalculated, and a mismatch rejects the question.` : '8. This archetype has no numeric answer — set claimed_numeric_value and calculation_inputs to null.'}

Return ONLY the structured fields defined by the schema.`
}

export function buildSemanticValidationPrompt(candidate: GeneratedQuestionStructured, blueprint: QuestionBlueprint): string {
  return `You are a strict FAA written-test question reviewer. Evaluate this candidate question independently — do not assume the generator got it right.

BLUEPRINT IT WAS SUPPOSED TO FOLLOW:
- ACS task: ${blueprint.acsTask}
- Concept: ${blueprint.conceptName}
- Authoritative source: ${blueprint.source}

VERIFIED RULE (ground truth):
${blueprint.ruleSummary}

CANDIDATE QUESTION:
${candidate.question}
A. ${candidate.choices.A}
B. ${candidate.choices.B}
C. ${candidate.choices.C}
Marked correct: ${candidate.correct_answer}
Claimed source reference: ${candidate.source_reference}
Explanation given: ${candidate.explanation}

Check each of the following independently and return a boolean for each:
- source_valid: Is "${candidate.source_reference}" a plausible, real citation consistent with the authoritative source above (not fabricated, not contradicting it)?
- exactly_one_correct: Is exactly ONE of A/B/C correct per the verified rule — could a knowledgeable pilot defend more than one?
- distractors_valid: Are BOTH wrong options plausible (not silly/obviously wrong) AND actually, objectively wrong per the verified rule?
- regulatory_consistent: Does every regulatory/numeric claim in the question and explanation match the verified rule exactly (no invented figures)?
- not_ambiguous: Is the question phrased so a knowledgeable pilot would read it only one way?
- matches_acs_task: Does this question actually test "${blueprint.acsTask}" / the "${blueprint.conceptName}" concept, not something else it happens to mention?
- scenario_consistent: Are all stated facts/variables in the scenario internally consistent (no contradictory numbers or conditions)?

"pass" must be true only if ALL seven are true. "reason" must explain the first failure found, or "all checks passed" if pass is true.`
}
