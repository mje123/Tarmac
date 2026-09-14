/**
 * Second figure type through Tarmac's figure pipeline (see src/lib/figureEngine) —
 * six-pack instrument-panel fault-diagnosis questions for the PPL
 * flight_instruments_pitot_static concept. Same pattern as
 * generate-vor-questions.mts: Tarmac's own code locks the scenario and the correct
 * answer before any AI call; OpenAI only writes prose grounded in that locked
 * scenario.
 *
 * Run: npx tsx scripts/generate-instrument-questions.mts [count]
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { generateInstrumentScenario, instrumentAnswerOptions, type InstrumentScenario, type InstrumentAnswerOption } from '../src/lib/figureEngine/instrumentPanel'
import { ProgrammaticFigureGenerator } from '../src/lib/figureEngine/generators'
import { OPENAI_MODEL } from '../src/lib/ai/providers/openai'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const CONCEPT_SLUG = 'flight_instruments_pitot_static'
const ARCHETYPE_ID = '4e329f13-53e6-43e8-8b47-8fe570c3e5af' // fault_diagnosis / application

interface ProseResult {
  question_text: string
  explanation: string
  distractor_rationale: string
  common_trap: string
}

async function generateProse(scenario: InstrumentScenario, options: InstrumentAnswerOption[], correctLabel: string): Promise<ProseResult> {
  const optionsList = options.map(o => `${o.letter}. ${o.label}`).join('\n')

  const prompt = `You are writing an FAA Private Pilot written-test practice question for Tarmac, an FAA written-test prep platform. This question is paired with a six-pack instrument panel figure the student will see (airspeed indicator, attitude indicator, altimeter, turn coordinator, heading indicator, and VSI).

LOCKED SCENARIO — you must not alter, invent, or contradict any of these values:
- The aircraft is in a steady ${scenario.phase}.
- The airspeed indicator reads ${Math.round(scenario.indicatedAirspeedKts)} knots.
- The altimeter reads ${scenario.indicatedAltitudeFt} feet${scenario.fault === 'blocked_static' ? ' and has not changed since before the aircraft began this ' + scenario.phase : ''}.
- The vertical speed indicator reads ${scenario.indicatedVsiFpm} feet per minute.
- The attitude indicator, heading indicator, and turn coordinator all show normal, level, non-turning indications.
- The correct diagnosis is: ${correctLabel} (do not state this outside of it being one of the answer choices).

ANSWER CHOICES (already fixed — do not change the letters, order, or wording):
${optionsList}

Write JSON with exactly these fields:
- "question_text": the question stem. Must say "Using the instrument panel shown below" or equivalent, describe the flight phase and the readings relevant to diagnosing the fault (do not just restate every number — focus on what's diagnostically odd), and ask what is most likely causing the abnormal indication(s). One to three sentences.
- "explanation": 2-4 sentences explaining why "${correctLabel}" is correct, applying the actual pitot-static rule (a blocked pitot tube makes the ASI behave like an altimeter — rising in a climb, falling in a descent; a blocked static port freezes the altimeter and VSI together while the ASI becomes unreliable), and noting that the attitude/heading/turn coordinator reading normally rules out a gyro (vacuum or electrical) failure.
- "distractor_rationale": 1-2 sentences on why a student might pick one of the other three choices.
- "common_trap": one sentence naming the single most common mistake for this concept.

Return ONLY valid JSON, no markdown fences.`

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    max_tokens: 600,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.choices[0]?.message?.content
  if (!text) throw new Error('OpenAI returned no content')
  return JSON.parse(text) as ProseResult
}

async function generateOne(index: number) {
  const scenario = generateInstrumentScenario()
  const options = instrumentAnswerOptions(scenario)
  const correct = options.find(o => o.isCorrect)!
  console.log(`\n[${index}] scenario:`, scenario)
  console.log(`[${index}] options:`, options.map(o => `${o.letter}=${o.label}${o.isCorrect ? ' (correct)' : ''}`).join(', '))

  const figure = await ProgrammaticFigureGenerator.generate({ type: 'instrument_panel', source: 'synthetic_programmatic', scenario, labels: [] })
  if (!figure.svg || figure.svg.length < 200) {
    throw new Error(`[${index}] figure generation produced suspiciously small/empty SVG — refusing to insert question without a real figure`)
  }

  const prose = await generateProse(scenario, options, correct.label)

  const { data: concept, error: conceptErr } = await supabase
    .from('concepts').select('id').eq('slug', CONCEPT_SLUG).single()
  if (conceptErr || !concept) throw new Error(`Concept ${CONCEPT_SLUG} not seeded: ${conceptErr?.message}`)

  const { data: archetype, error: archetypeErr } = await supabase
    .from('question_archetypes').select('id, cognitive_level, scenario_type')
    .eq('id', ARCHETYPE_ID).single()
  if (archetypeErr || !archetype) throw new Error(`Archetype ${ARCHETYPE_ID} not found: ${archetypeErr?.message}`)

  const optionText: Record<string, string> = {}
  for (const o of options) optionText[o.letter] = o.label

  const { data: inserted, error: insertErr } = await supabase.from('questions').insert({
    exam_type: 'ppl',
    category: 'Flight Instruments',
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
    reference: 'FAA-H-8083-25C, Chapter 8 (Flight Instruments)',
    concept_id: concept.id,
    archetype_id: archetype.id,
    cognitive_level: archetype.cognitive_level,
    scenario_type: archetype.scenario_type,
    figure_required: true,
    figure_type: 'instrument_panel',
    figure_source: 'synthetic_programmatic',
    figure_version: 'v1',
    figure_metadata: { svg: figure.svg, accessibilityDescription: figure.accessibilityDescription, scenario },
    visual_concept: 'Six-pack instrument panel (ASI, AI, ALT, TC, HI, VSI) showing readings consistent with either a blocked pitot tube or blocked static port',
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
  console.log(`\nDone. Inserted ${ids.length} instrument-panel questions:`, ids)
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
