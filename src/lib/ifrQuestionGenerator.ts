import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'

export const IFR_CATEGORIES = [
  'IFR Regulations',
  'Instrument Navigation',
  'Instrument Approaches',
  'IFR Weather',
  'IFR En Route',
  'ATC & Communications',
  'Instrument Systems',
  'Departure & Arrivals',
  'IFR Emergency Operations',
] as const

export type IFRCategory = typeof IFR_CATEGORIES[number]

const IFR_CATEGORY_TOPICS: Record<IFRCategory, string> = {
  'IFR Regulations': 'FAR 61.57 IFR currency, FAR 91.167-91.185 IFR flight rules, alternate airport requirements, fuel requirements, equipment requirements for IFR flight, logging instrument time, safety pilot requirements for simulated IFR.',
  'Instrument Navigation': 'VOR navigation (CDI deflection, OBS, TO/FROM), ILS components (localizer, glide slope, marker beacons), GPS/RNAV approaches, DME arcs, holding patterns (entry procedures, timing, wind correction), HSI interpretation, RMI.',
  'Instrument Approaches': 'ILS approach procedures (DA, DH, decision altitude), LOC/LOC-BC approaches, VOR approaches, RNAV/GPS approaches, LPV/LNAV/VNAV minima, circling approaches, missed approach procedures, reading approach plates (FAA-CT-8080-3F figures), visibility and ceiling requirements.',
  'IFR Weather': 'METAR and TAF decoding for IFR, SIGMETs, AIRMETs Sierra/Tango/Zulu, PIREPs, winds aloft interpretation, icing conditions and types, turbulence, thunderstorm avoidance, freezing level, structural icing certification requirements, IMC weather minimums.',
  'IFR En Route': 'IFR en route charts (FAA-CT-8080-3F Legends 33-35), MEA/MOCA/MCA/MRA/MAA, victor airways, jet routes, RNAV routes, compulsory vs non-compulsory reporting points, changeover points, DME, off-route obstruction clearance.',
  'ATC & Communications': 'IFR clearances (CRAFT acronym), position reports, ATC radar services, lost communications procedures (FAR 91.185), transponder requirements, LAHSO clearances, departure clearances, void time clearances, receiving IFR clearance in the air.',
  'Instrument Systems': 'Pitot-static system errors and blockages, gyroscopic instruments (attitude indicator, heading indicator, turn coordinator), errors and precession, vacuum system, electrical backup, standby instruments, glass cockpit failures, ADC failures. Reference FAA-CT-8080-3F Figures 144-151.',
  'Departure & Arrivals': 'Standard Instrument Departures (SIDs), Obstacle Departure Procedures (ODPs), Standard Terminal Arrival Routes (STARs), reading departure/arrival charts (FAA-CT-8080-3F), climb gradients, diverse departure criteria, top altitude, expect further clearance.',
  'IFR Emergency Operations': 'Lost communication procedures (VFR on top, MEA, assigned altitude), two-way radio failure in controlled/uncontrolled airspace, declaring emergency, transponder squawk 7600/7700/7500, emergency descent, engine-out IFR, partial panel flying techniques.',
}

export async function generateAndSaveIFRQuestions(category: IFRCategory, count: number): Promise<number> {
  const topics = IFR_CATEGORY_TOPICS[category]

  const prompt = `Generate exactly ${count} FAA Instrument Rating Airplane (IRA) knowledge test questions for the category: "${category}".

Topics to cover: ${topics}

STRICT RULES:
1. Each question must have exactly 3 answer options (A, B, C) — NO option D
2. Only ONE option is correct
3. Questions must mirror actual FAA IRA test style and phrasing
4. Use FAA/ICAO terminology exactly as used in the AIM and FARs
5. Include practical, scenario-based questions (not just definitions)
6. Mix difficulty: ~30% easy, 50% medium, 20% hard
7. Correct answer must be definitively correct per FAR/AIM/IFH
8. Several questions should reference figures from the Instrument Rating Testing Supplement (FAA-CT-8080-3F)

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "question_text": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "correct_answer": "A",
    "difficulty": "medium",
    "explanation": "2-3 sentence explanation of why the correct answer is right and why others are wrong.",
    "reference": "14 CFR 91.185 or AIM 5-3-3"
  }
]`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
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
    exam_type: 'ifr',
  }))

  const { error } = await admin.from('questions').insert(rows)
  if (error) throw new Error(`DB insert failed: ${error.message}`)

  return rows.length
}

export { IFR_CATEGORIES as CATEGORIES }
