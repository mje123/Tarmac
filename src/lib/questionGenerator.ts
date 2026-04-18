import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const CATEGORIES = [
  'Regulations', 'Airspace', 'Weather Theory', 'Weather Services',
  'Aircraft Performance', 'Weight & Balance', 'Aerodynamics',
  'Flight Instruments', 'Navigation',
] as const

type Category = typeof CATEGORIES[number]

const CATEGORY_TOPICS: Record<Category, string> = {
  'Regulations': 'Part 61 currency, Part 91 operating rules, NTSB 830, medical certificates, logbook requirements, right of way, safety pilot, endorsements. Include 2 questions referencing "FAA-CT-8080-2H, Legend 1" for sectional chart reading.',
  'Airspace': 'Class A/B/C/D/E/G weather minimums, TFRs, special use airspace, Mode C, ADS-B requirements, VFR corridors. Include 2 questions referencing sectional chart legends from FAA-CT-8080-2H.',
  'Weather Theory': 'Fronts, fog formation, icing, thunderstorm stages, stability, lapse rates, wind shear, microbursts. Include 2 questions referencing "FAA-CT-8080-2H, Figure 1" (Lift Vector) or "Figure 2" (Load Factor Chart).',
  'Weather Services': 'METAR decoding, TAF reading, PIREPs, SIGMETs, AIRMETs, winds aloft, radar imagery. Include 4 questions referencing "FAA-CT-8080-2H, Figure 12" (METAR sample), "Figure 15" (TAF), "Figure 13" (weather briefing), or "Figure 14" (PIREP). Embed realistic decoded strings in the question text.',
  'Aircraft Performance': 'Takeoff/landing charts, density altitude, headwind/tailwind corrections, fuel planning, climb performance. Include 3 questions referencing "FAA-CT-8080-2H, Figure 8" (Density Altitude Chart) with specific values to interpolate.',
  'Weight & Balance': 'CG calculations, loading envelopes, moment arms, effects of CG on stability, maximum gross weight, zero fuel weight.',
  'Aerodynamics': 'Lift/drag, stall, spin, load factor, Vg diagram, turns, adverse yaw, ground effect, wake turbulence, P-factor. Include 2 questions referencing "FAA-CT-8080-2H, Figure 2" (Load Factor Chart) asking for load factor at specific bank angles.',
  'Flight Instruments': 'Pitot-static system, gyroscopic instruments, magnetic compass errors, altimeter settings, instrument failures. Include 3 questions referencing "FAA-CT-8080-2H, Figure 3" (Altimeter), "Figure 4" (Airspeed Indicator), "Figure 5" (Turn Coordinator), "Figure 6" (Heading Indicator), or "Figure 7" (Attitude Indicator).',
  'Navigation': 'VOR tracking, GPS, dead reckoning, E6B calculations, sectional chart symbols, airspace depiction. Include 3 questions referencing sectional chart legends from "FAA-CT-8080-2H, Legend 1" through "Legend 19".',
}

export async function generateAndSaveQuestions(category: Category, count: number): Promise<number> {
  const topics = CATEGORY_TOPICS[category]

  const prompt = `Generate exactly ${count} FAA Private Pilot Airplane (PAR) knowledge test questions for the category: "${category}".

Topics to cover: ${topics}

STRICT RULES:
1. Each question must have exactly 3 answer options (A, B, C) — NO option D
2. Only ONE option is correct
3. Questions must mirror actual FAA test style and phrasing
4. Use FAA/ICAO terminology exactly
5. Include practical, scenario-based questions (not just definitions)
6. Mix difficulty: ~40% easy, 40% medium, 20% hard
7. Correct answer must be definitively correct per FAR/AIM/PHAK

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "question_text": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "correct_answer": "A",
    "difficulty": "easy",
    "explanation": "2-3 sentence explanation of why the correct answer is right.",
    "reference": "14 CFR 91.155 or AIM 3-2-4"
  }
]`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No JSON array in response')

  const questions = JSON.parse(match[0])
  if (!Array.isArray(questions) || questions.length === 0) throw new Error('Invalid questions format')

  const admin = createAdminClient()
  const rows = questions.map((q: Record<string, string>) => ({
    question_text: q.question_text,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    option_d: '',
    correct_answer: q.correct_answer,
    category,
    difficulty: q.difficulty || 'medium',
    explanation: q.explanation,
    reference: q.reference || null,
  }))

  const { error } = await admin.from('questions').insert(rows)
  if (error) throw new Error(`DB insert failed: ${error.message}`)

  return rows.length
}

export { CATEGORIES, type Category }
