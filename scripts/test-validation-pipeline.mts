/**
 * Phase 5 fail-safe tests (spec section 13). Exercises validate.ts and generate.ts's
 * error paths directly against crafted bad inputs — this does NOT test "the API
 * returned a response," it tests that a wrong/malformed/dangerous response is caught
 * and never reaches a student.
 *
 * Run: npx tsx scripts/test-validation-pipeline.ts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { validateCandidate, type RecentQuestionRow } from '../src/lib/ai/validate'
import { buildBlueprint } from '../src/lib/ai/blueprint'
import { runGenerationAttempt } from '../src/lib/ai/generate'
import type { AIProvider, ValidateQuestionResult } from '../src/lib/ai/providers/types'
import type { GeneratedQuestionStructured, SemanticValidationResult } from '../src/lib/ai/schema'

let pass = 0, fail = 0

function check(name: string, condition: boolean, detail?: string) {
  if (condition) { pass++; console.log(`PASS  ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

function baseCandidate(overrides: Partial<GeneratedQuestionStructured> = {}): GeneratedQuestionStructured {
  return {
    exam: 'ifr', acs_area: 'ATC Clearances and Communication', acs_task: 'IR.VIII.A',
    concept: 'Lost Communications Procedures (91.185)', source: '14 CFR 91.185', source_reference: '14 CFR 91.185(c)(1)(iii)',
    archetype: 'application', difficulty: 'medium', cognitive_level: 'application',
    scenario: 'IFR flight, radio failure.', question: 'In IFR conditions after two-way radio failure, which altitude must the pilot fly?',
    choices: { A: 'The assigned altitude', B: 'The highest of assigned, expected, or MEA', C: 'The lowest safe altitude' },
    correct_answer: 'B', explanation: 'Per 91.185, the pilot flies the highest of assigned, expected, or MEA.',
    distractor_rationale: 'A ignores expected/MEA; C is not a real 91.185 concept.', common_trap: 'Using only the assigned altitude.',
    variables: { flight_conditions: 'IFR' }, novelty_key: 'altitude priority test',
    figure_required: false, figure_type: null, figure_source: null, visual_concept: null,
    ...overrides,
  }
}

function mockProvider(semanticResult: Partial<SemanticValidationResult>): AIProvider {
  const result: SemanticValidationResult = {
    source_valid: true, exactly_one_correct: true, distractors_valid: true, regulatory_consistent: true,
    not_ambiguous: true, matches_acs_task: true, scenario_consistent: true, pass: true, reason: 'all checks passed',
    ...semanticResult,
  }
  const call: ValidateQuestionResult = { result, provider: 'anthropic', model: 'mock', latencyMs: 1, usage: {} }
  return {
    name: 'anthropic',
    generateQuestion: async () => { throw new Error('not used in this test') },
    validateQuestion: async () => call,
    generateExplanation: async () => { throw new Error('not used in this test') },
    analyzeFigure: async () => { throw new Error('not implemented') },
  }
}

async function main() {
  const blueprint = await buildBlueprint('atc_lost_comm_procedures', { mode: 'new_question' })
  const passingProvider = mockProvider({})
  const noRecent: RecentQuestionRow[] = []

  // 1. Malformed / invalid-schema output — empty choices
  {
    const bad = baseCandidate({ choices: { A: '', B: 'x', C: 'y' } })
    const r = await validateCandidate({ candidate: bad, blueprint, provider: passingProvider, recentQuestions: noRecent })
    check('malformed output (empty choice) is rejected structurally', !r.approved && r.reason === 'structural')
  }

  // 2. Invalid schema — missing choices object entirely (simulates a provider returning
  //    something that doesn't even match the JSON schema shape)
  {
    const bad = { ...baseCandidate(), choices: undefined } as unknown as GeneratedQuestionStructured
    const r = await validateCandidate({ candidate: bad, blueprint, provider: passingProvider, recentQuestions: noRecent })
    check('invalid schema (missing choices) is rejected, not crashed', !r.approved && r.reason === 'structural')
  }

  // 3. correct_answer not A/B/C
  {
    const bad = baseCandidate({ correct_answer: 'D' as GeneratedQuestionStructured['correct_answer'] })
    const r = await validateCandidate({ candidate: bad, blueprint, provider: passingProvider, recentQuestions: noRecent })
    check('correct_answer outside A/B/C is rejected', !r.approved && r.reason === 'structural')
  }

  // 4. Multiple correct answers (judge says exactly_one_correct: false)
  {
    const good = baseCandidate()
    const provider = mockProvider({ exactly_one_correct: false, pass: false, reason: 'Both A and B are defensible.' })
    const r = await validateCandidate({ candidate: good, blueprint, provider, recentQuestions: noRecent })
    check('multiple-correct-answer candidate is rejected', !r.approved && r.reason === 'ambiguous_or_multiple_correct')
  }

  // 5. Unsupported / fabricated source
  {
    const bad = baseCandidate({ source_reference: '14 CFR 999.999 (does not exist)' })
    const provider = mockProvider({ source_valid: false, pass: false, reason: 'Citation does not exist.' })
    const r = await validateCandidate({ candidate: bad, blueprint, provider, recentQuestions: noRecent })
    check('fabricated source citation is rejected', !r.approved && r.reason === 'source_invalid')
  }

  // 6. Bad distractors
  {
    const provider = mockProvider({ distractors_valid: false, pass: false, reason: 'Distractor C is nonsensical.' })
    const r = await validateCandidate({ candidate: baseCandidate(), blueprint, provider, recentQuestions: noRecent })
    check('implausible distractor is rejected', !r.approved && r.reason === 'distractor_invalid')
  }

  // 7. Regulatory contradiction
  {
    const provider = mockProvider({ regulatory_consistent: false, pass: false, reason: 'Explanation cites the wrong altitude priority.' })
    const r = await validateCandidate({ candidate: baseCandidate(), blueprint, provider, recentQuestions: noRecent })
    check('regulatory contradiction is rejected', !r.approved && r.reason === 'regulatory_inconsistent')
  }

  // 8. Unrelated concept (ACS mismatch)
  {
    const provider = mockProvider({ matches_acs_task: false, pass: false, reason: 'Question actually tests VOR navigation, not lost comm.' })
    const r = await validateCandidate({ candidate: baseCandidate(), blueprint, provider, recentQuestions: noRecent })
    check('question testing an unrelated concept is rejected', !r.approved && r.reason === 'acs_mismatch')
  }

  // 9. Internally inconsistent scenario
  {
    const provider = mockProvider({ scenario_consistent: false, pass: false, reason: 'Scenario states VFR and IFR simultaneously.' })
    const r = await validateCandidate({ candidate: baseCandidate(), blueprint, provider, recentQuestions: noRecent })
    check('internally inconsistent scenario is rejected', !r.approved && r.reason === 'scenario_inconsistent')
  }

  // 10. Duplicate question (novelty)
  {
    const candidate = baseCandidate()
    const recent: RecentQuestionRow[] = [{
      concept_id: blueprint.conceptId, scenario_type: blueprint.scenarioType,
      question_text: candidate.question, correct_answer: candidate.correct_answer,
    }]
    const r = await validateCandidate({ candidate, blueprint, provider: passingProvider, recentQuestions: recent })
    check('near-duplicate of a recent question is rejected', !r.approved && r.reason === 'duplicate_wording')
  }

  // 11. Missing figure — claims figure_required but Phase 5 has no figure pipeline
  {
    const bad = baseCandidate({ figure_required: true, figure_type: 'approach_plate', figure_source: 'FAA-CT-8080-3F Figure 12' })
    const r = await validateCandidate({ candidate: bad, blueprint, provider: passingProvider, recentQuestions: noRecent })
    check('figure-required candidate is held, never approved', !r.approved && r.reason === 'figure_unavailable')
  }

  // 12. Numerical error — density_altitude has a real compute(); claim a wildly wrong value
  {
    const daBlueprint = await buildBlueprint('density_altitude', { mode: 'new_question', archetypeScenarioType: 'calculation' })
    const bad = baseCandidate({
      exam: 'ppl', concept: 'Density Altitude',
      claimed_numeric_value: 99999, // absurd vs. any real computation
      calculation_inputs: { field_elevation_ft: 2000, altimeter_setting_inhg: 29.92, temperature_c: 25 },
    })
    const r = await validateCandidate({ candidate: bad, blueprint: daBlueprint, provider: passingProvider, recentQuestions: noRecent })
    check('wrong deterministic calculation is rejected (never trusts LLM arithmetic)', !r.approved && r.reason === 'numeric_mismatch', `got reason=${r.reason} detail=${r.detail}`)
  }

  // 13. Exam mismatch (a concrete "wrong output" shape a schema check alone won't catch)
  {
    const bad = baseCandidate({ exam: 'ppl' }) // blueprint concept is 'ifr'
    const r = await validateCandidate({ candidate: bad, blueprint, provider: passingProvider, recentQuestions: noRecent })
    check('exam mismatch between blueprint and candidate is rejected', !r.approved && r.reason === 'exam_mismatch')
  }

  // 14. A genuinely good candidate is approved (sanity check the pipeline isn't just
  //     rejecting everything)
  {
    const r = await validateCandidate({ candidate: baseCandidate(), blueprint, provider: passingProvider, recentQuestions: noRecent })
    check('a valid candidate is approved', r.approved === true, `reason=${r.reason} detail=${r.detail}`)
  }

  // 15. Provider failure / timeout / rate limit — runGenerationAttempt must never
  //     throw or insert a row; it must log and return approved:false. Forced via a
  //     deliberately invalid OpenAI key so this is a REAL request failure, not a mock.
  {
    const realKey = process.env.OPENAI_API_KEY
    process.env.OPENAI_API_KEY = 'sk-invalid-key-for-fail-safe-test'
    try {
      const result = await runGenerationAttempt({ conceptSlug: 'atc_lost_comm_procedures', provider: 'openai', mode: 'new_question' })
      check('provider auth failure is caught and returned as a rejection, not thrown', result.approved === false && result.reason === 'provider_error', `reason=${result.reason}`)
    } catch (err) {
      check('provider auth failure is caught and returned as a rejection, not thrown', false, `threw instead: ${err}`)
    } finally {
      process.env.OPENAI_API_KEY = realKey
    }
  }

  // 16. Unavailable / unconfigured provider — must throw a clear setup error, not
  //     silently fall back to a different provider.
  {
    const realKey = process.env.GEMINI_API_KEY
    delete process.env.GEMINI_API_KEY
    try {
      await runGenerationAttempt({ conceptSlug: 'atc_lost_comm_procedures', provider: 'gemini', mode: 'new_question' })
      check('missing provider key fails fast', false, 'did not throw')
    } catch (err) {
      check('missing provider key fails fast (no silent fallback)', err instanceof Error && err.message.includes('GEMINI_API_KEY'))
    } finally {
      if (realKey) process.env.GEMINI_API_KEY = realKey
    }
  }

  // 17. Unseeded concept — must fail loudly rather than let the model invent the rule
  {
    try {
      await buildBlueprint('not_a_real_concept' as never, { mode: 'new_question' })
      check('unseeded/unknown concept fails loudly', false, 'did not throw')
    } catch {
      check('unseeded/unknown concept fails loudly', true)
    }
  }

  console.log(`\n${pass} passed, ${fail} failed`)
  process.exit(fail > 0 ? 1 : 0)
}

main().catch(err => { console.error('Test runner crashed:', err); process.exit(1) })
