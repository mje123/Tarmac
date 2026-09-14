/**
 * First real run of Tarmac's figure pipeline (see src/lib/figures) — generates real,
 * playable VOR radial-interpretation questions with a genuine deterministic SVG figure
 * attached, and inserts them into the live `questions` table so they're immediately
 * servable through the existing /api/questions/random -> Practice/Learn/Transfer/
 * Weakness/Diagnostic/Review flow, exactly like any other question.
 *
 * Pipeline (matches src/lib/figures/types.ts's FigureGenerator contract):
 *   generateVorScenario()      -- Tarmac's own code decides the scenario, never the AI
 *   vorAnswerOptions()         -- correct answer + distractors derived from the scenario
 *   ProgrammaticFigureGenerator -- deterministic SVG rendered from the same scenario
 *   OpenAI                     -- writes ONLY the prose (question stem, explanation,
 *                                 distractor rationale, common trap) grounded in the
 *                                 locked scenario/options it's handed — it never
 *                                 invents a radial, course, or answer value itself.
 *
 * If the figure fails to render, or OpenAI's prose doesn't survive a sanity check, the
 * row is not inserted — a figure_required question must never reach a student without
 * its figure (spec section 14).
 *
 * Run: npx tsx scripts/generate-vor-questions.mts [count]
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { generateVorScenario, vorAnswerOptions, type VorScenario, type VorAnswerOption } from '../src/lib/figureEngine/vor'
import { ProgrammaticFigureGenerator } from '../src/lib/figureEngine/generators'
import { OPENAI_MODEL } from '../src/lib/ai/providers/openai'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const CONCEPT_SLUG = 'vor_radial_interpretation'
const ARCHETYPE_SCENARIO_TYPE = 'scenario'

function courseLabel(v: number): string {
  return `${String(v).padStart(3, '0')}°`
}

interface ProseResult {
  question_text: string
  explanation: string
  distractor_rationale: string
  common_trap: string
}

async function generateProse(scenario: VorScenario, options: VorAnswerOption[], correctLabel: string): Promise<ProseResult> {
  const optionsList = options.map(o => `${o.letter}. ${courseLabel(o.value)}`).join('\n')

  const prompt = `You are writing an FAA Instrument Rating written-test practice question for Tarmac, an FAA written-test prep platform. This question is paired with a VOR navigation diagram the student will see (a compass rose centered on the VOR station, with the aircraft drawn at its true position, and a CDI readout box showing the selected course and TO/FROM indication).

LOCKED SCENARIO — you must not alter, invent, or contradict any of these values:
- VOR station identifier: ${scenario.station}
- CDI selected course: ${courseLabel(scenario.selectedCourse)}
- CDI indication: ${scenario.toFrom}
- Aircraft heading shown in the figure: ${courseLabel(scenario.aircraftHeading)}
- The question must ask the student to determine the radial the aircraft is currently on, using the figure.
- The correct answer is ${correctLabel} (do not state this number outside of it being one of the answer choices below).

ANSWER CHOICES (already fixed — do not change the letters or values):
${optionsList}

Write JSON with exactly these fields:
- "question_text": the question stem. Must explicitly say "Using the figure below" or equivalent, describe that the CDI is centered with the given indication on the given course, and ask which radial the aircraft is on. Do not restate the aircraft heading unless natural. Keep it concise, one to two sentences.
- "explanation": 2-3 sentences explaining why ${correctLabel} is correct, applying the rule that a centered CDI with a FROM indication means the aircraft is on that radial, while a TO indication means the aircraft is on the reciprocal radial. Reference the actual station identifier and selected course from the scenario.
- "distractor_rationale": 1-2 sentences on why a student might pick one of the other three answer choices (e.g. confusing the selected course with the radial, or flying the wrong reciprocal).
- "common_trap": one sentence naming the single most common mistake for this concept (confusing TO/FROM sensing).

Return ONLY valid JSON, no markdown fences.`

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    max_tokens: 500,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.choices[0]?.message?.content
  if (!text) throw new Error('OpenAI returned no content')
  return JSON.parse(text) as ProseResult
}

async function generateOne(index: number) {
  const scenario = generateVorScenario()
  const options = vorAnswerOptions(scenario)
  const correct = options.find(o => o.isCorrect)!
  console.log(`\n[${index}] scenario:`, scenario)
  console.log(`[${index}] options:`, options.map(o => `${o.letter}=${courseLabel(o.value)}${o.isCorrect ? ' (correct)' : ''}`).join(', '))

  // Figure generation (spec 14: never serve a figure_required question without its figure)
  const figure = await ProgrammaticFigureGenerator.generate({ type: 'vor_navigation', source: 'synthetic_programmatic', scenario, labels: [] })
  if (!figure.svg || figure.svg.length < 200) {
    throw new Error(`[${index}] figure generation produced suspiciously small/empty SVG — refusing to insert question without a real figure`)
  }

  const prose = await generateProse(scenario, options, courseLabel(correct.value))

  // Sanity check: the prose must not silently contradict the locked scenario by
  // introducing a different station or selected-course value than we gave it.
  if (!prose.question_text.includes(scenario.station)) {
    throw new Error(`[${index}] generated question text doesn't reference the locked station ${scenario.station} — rejecting rather than risk a contradicted figure`)
  }

  const optionText: Record<string, string> = {}
  for (const o of options) optionText[o.letter] = courseLabel(o.value)

  const { data: concept, error: conceptErr } = await supabase
    .from('concepts').select('id').eq('slug', CONCEPT_SLUG).single()
  if (conceptErr || !concept) throw new Error(`Concept ${CONCEPT_SLUG} not seeded: ${conceptErr?.message}`)

  const { data: archetype, error: archetypeErr } = await supabase
    .from('question_archetypes').select('id, cognitive_level, scenario_type')
    .eq('concept_id', concept.id).eq('scenario_type', ARCHETYPE_SCENARIO_TYPE).single()
  if (archetypeErr || !archetype) throw new Error(`Archetype ${ARCHETYPE_SCENARIO_TYPE} not seeded for ${CONCEPT_SLUG}: ${archetypeErr?.message}`)

  const { data: inserted, error: insertErr } = await supabase.from('questions').insert({
    exam_type: 'ifr',
    category: 'Instrument Navigation',
    question_text: prose.question_text,
    option_a: optionText.A,
    option_b: optionText.B,
    option_c: optionText.C,
    option_d: optionText.D,
    correct_answer: correct.letter,
    difficulty: 'medium',
    explanation: prose.explanation,
    distractor_rationale: prose.distractor_rationale,
    common_trap: prose.common_trap,
    reference: 'AIM 1-1-3 (VOR service volume/accuracy); Instrument Flying Handbook Ch. 7',
    concept_id: concept.id,
    archetype_id: archetype.id,
    cognitive_level: archetype.cognitive_level,
    scenario_type: archetype.scenario_type,
    figure_required: true,
    figure_type: 'vor_navigation',
    figure_source: 'synthetic_programmatic',
    figure_version: 'v1',
    figure_metadata: { svg: figure.svg, accessibilityDescription: figure.accessibilityDescription, scenario },
    visual_concept: 'VOR compass rose showing aircraft position relative to station, with CDI selected-course/TO-FROM readout',
    provider: 'openai',
    model_version: OPENAI_MODEL,
    generation_mode: 'new_question',
    validation_status: 'approved', // correctness is derived deterministically from the scenario, not model-judged
  }).select('id').single()

  if (insertErr || !inserted) throw new Error(`[${index}] insert failed: ${insertErr?.message}`)
  console.log(`[${index}] inserted question ${inserted.id}: "${prose.question_text}"`)
  return inserted.id
}

async function main() {
  const count = Number(process.argv[2]) || 5
  const ids: string[] = []
  for (let i = 0; i < count; i++) {
    const id = await generateOne(i + 1)
    ids.push(id)
  }
  console.log(`\nDone. Inserted ${ids.length} VOR questions:`, ids)
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
