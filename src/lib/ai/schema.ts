// Structured output contract for the provider-agnostic question generator (Phase 5).
// Every provider MUST return JSON matching this shape via its native schema/structured-
// output feature — never free-form text parsed with a regex. Schema-valid JSON is a
// necessary but not sufficient condition for a good question: semantic correctness is
// still checked afterward (see validate.ts). Fields mirror the spec's blueprint list;
// nothing here duplicates an existing `questions`/`concepts` column without reason —
// e.g. `source` and `concept` are restated in the output (not just implied by the
// blueprint) so validation can catch a model that silently drifted off its own brief.

export type AnswerLetter = 'A' | 'B' | 'C'

export interface GeneratedQuestionStructured {
  exam: 'ppl' | 'ifr'
  acs_area: string
  acs_task: string
  concept: string
  source: string
  source_reference: string
  archetype: string
  difficulty: 'easy' | 'medium' | 'hard'
  cognitive_level: 'recall' | 'application' | 'scenario' | 'multi_concept' | 'transfer'
  scenario: string
  question: string
  choices: { A: string; B: string; C: string }
  correct_answer: AnswerLetter
  explanation: string
  distractor_rationale: string
  common_trap: string
  /** The specific variable values this instance used, e.g. {"temperature_c": 22}. Over
   *  the wire this is a JSON-encoded string (see QUESTION_JSON_SCHEMA) — always parsed
   *  to this shape by parseStructuredFields() before any other code sees a candidate. */
  variables: Record<string, string | number>
  /** The model's own short description of what makes this instance different from a
   *  prior one it was shown (see blueprint.avoidSimilarTo). Advisory only — the
   *  `questions.novelty_key` column actually stored is always the deterministic value
   *  computed by novelty.ts, never this self-report. */
  novelty_key: string
  figure_required: boolean
  figure_type: string | null
  figure_source: string | null
  visual_concept: string | null
  /** Present only when the blueprint's archetype is a calculation — independently
   *  recomputed and compared against concept.numeric.compute() in validate.ts. */
  claimed_numeric_value?: number
  /** Also a JSON-encoded string over the wire — see `variables` above. */
  calculation_inputs?: Record<string, number>
}

/** Every provider returns `variables`/`calculation_inputs` as JSON-encoded strings
 *  (see QUESTION_JSON_SCHEMA's comment) — this is the ONE place that re-inflates them
 *  back into objects, called by every provider immediately after receiving a response
 *  so nothing downstream (validate.ts, generate.ts) ever has to know the wire format. */
export function parseStructuredFields(raw: Record<string, unknown>): GeneratedQuestionStructured {
  const parsed = { ...raw } as Record<string, unknown>
  for (const field of ['variables', 'calculation_inputs'] as const) {
    const value = parsed[field]
    if (typeof value === 'string') {
      try { parsed[field] = value.trim() ? JSON.parse(value) : (field === 'variables' ? {} : null) }
      catch { parsed[field] = field === 'variables' ? {} : null } // malformed JSON -> downstream structural/numeric checks reject appropriately
    }
  }
  return parsed as unknown as GeneratedQuestionStructured
}

// Plain JSON Schema (draft-07-ish subset) shared by every provider. OpenAI consumes
// this close to verbatim (wrapped in {name, schema, strict:true}); Gemini's SDK wants
// its own `Schema`/`SchemaType` shape, so providers/gemini.ts converts this rather than
// hand-maintaining a second copy that could drift out of sync.
export const QUESTION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    exam: { type: 'string', enum: ['ppl', 'ifr'] },
    acs_area: { type: 'string' },
    acs_task: { type: 'string' },
    concept: { type: 'string' },
    source: { type: 'string' },
    source_reference: { type: 'string' },
    archetype: { type: 'string' },
    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
    cognitive_level: { type: 'string', enum: ['recall', 'application', 'scenario', 'multi_concept', 'transfer'] },
    scenario: { type: 'string' },
    question: { type: 'string' },
    choices: {
      type: 'object',
      additionalProperties: false,
      properties: { A: { type: 'string' }, B: { type: 'string' }, C: { type: 'string' } },
      required: ['A', 'B', 'C'],
    },
    correct_answer: { type: 'string', enum: ['A', 'B', 'C'] },
    explanation: { type: 'string' },
    distractor_rationale: { type: 'string' },
    common_trap: { type: 'string' },
    // Free-form dynamic-key objects aren't representable in every provider's strict
    // structured-output mode (OpenAI's strict JSON Schema rejects a non-boolean
    // additionalProperties here) — transported as a JSON-encoded string and re-inflated
    // by parseStructuredFields() below, so every provider gets the identical schema.
    variables: { type: 'string', description: 'JSON-encoded object of the variable values actually used, e.g. {"temperature_c":22}.' },
    novelty_key: { type: 'string' },
    figure_required: { type: 'boolean' },
    figure_type: { type: ['string', 'null'] },
    figure_source: { type: ['string', 'null'] },
    visual_concept: { type: ['string', 'null'] },
    claimed_numeric_value: { type: ['number', 'null'] },
    calculation_inputs: { type: ['string', 'null'], description: 'JSON-encoded object of numeric inputs, e.g. {"field_elevation_ft":2000}. Null when this archetype has no calculation.' },
  },
  required: [
    'exam', 'acs_area', 'acs_task', 'concept', 'source', 'source_reference', 'archetype',
    'difficulty', 'cognitive_level', 'scenario', 'question', 'choices', 'correct_answer',
    'explanation', 'distractor_rationale', 'common_trap', 'variables', 'novelty_key',
    'figure_required', 'figure_type', 'figure_source', 'visual_concept',
    'claimed_numeric_value', 'calculation_inputs',
  ],
} as const

// Semantic (judge) validation output — one structured call replaces what would
// otherwise be 6 separate LLM round-trips (source/answer/regulatory/ambiguity/
// distractor/ACS checks), each as its own boolean so a rejection reason is always
// specific rather than a single opaque pass/fail.
export interface SemanticValidationResult {
  source_valid: boolean
  exactly_one_correct: boolean
  distractors_valid: boolean
  regulatory_consistent: boolean
  not_ambiguous: boolean
  matches_acs_task: boolean
  scenario_consistent: boolean
  pass: boolean
  reason: string
}

export const SEMANTIC_VALIDATION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    source_valid: { type: 'boolean' },
    exactly_one_correct: { type: 'boolean' },
    distractors_valid: { type: 'boolean' },
    regulatory_consistent: { type: 'boolean' },
    not_ambiguous: { type: 'boolean' },
    matches_acs_task: { type: 'boolean' },
    scenario_consistent: { type: 'boolean' },
    pass: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: [
    'source_valid', 'exactly_one_correct', 'distractors_valid', 'regulatory_consistent',
    'not_ambiguous', 'matches_acs_task', 'scenario_consistent', 'pass', 'reason',
  ],
} as const
