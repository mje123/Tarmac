// Legacy one-shot batch generator — unparameterized, unvalidated beyond a JSON shape
// check. This is the FALLBACK content source for any category that doesn't yet have
// concept coverage in concepts.ts (see the validated pipeline in index.ts, which is
// the primary path going forward). Rows inserted here get validation_status='legacy'
// by the questions table's default.
//
// Previously this was two near-duplicate files (questionGenerator.ts,
// ifrQuestionGenerator.ts) differing only in category list, topic text, and
// exam_type. Unified here so PPL/IFR share one code path.

import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'

export const PPL_CATEGORIES = [
  'Regulations', 'Airspace', 'Weather Theory', 'Weather Services',
  'Aircraft Performance', 'Weight & Balance', 'Aerodynamics',
  'Flight Instruments', 'Navigation',
] as const

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

export type PPLCategory = typeof PPL_CATEGORIES[number]
export type IFRCategory = typeof IFR_CATEGORIES[number]
export type LegacyCategory = PPLCategory | IFRCategory
export type LegacyExamType = 'ppl' | 'ifr'

const PPL_CATEGORY_TOPICS: Record<PPLCategory, string> = {
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

function topicsFor(examType: LegacyExamType, category: LegacyCategory): string {
  return examType === 'ifr'
    ? IFR_CATEGORY_TOPICS[category as IFRCategory]
    : PPL_CATEGORY_TOPICS[category as PPLCategory]
}

export async function generateAndSaveLegacyQuestions(
  examType: LegacyExamType,
  category: LegacyCategory,
  count: number
): Promise<number> {
  const topics = topicsFor(examType, category)
  const examLabel = examType === 'ifr' ? 'Instrument Rating Airplane (IRA)' : 'Private Pilot Airplane (PAR)'
  const difficultyMix = examType === 'ifr' ? '~30% easy, 50% medium, 20% hard' : '~40% easy, 40% medium, 20% hard'
  const referenceGuide = examType === 'ifr' ? 'FAR/AIM/IFH' : 'FAR/AIM/PHAK'
  const supplementNote = examType === 'ifr'
    ? '8. Several questions should reference figures from the Instrument Rating Testing Supplement (FAA-CT-8080-3F)'
    : ''

  const prompt = `Generate exactly ${count} FAA ${examLabel} knowledge test questions for the category: "${category}".

Topics to cover: ${topics}

STRICT RULES:
1. Each question must have exactly 3 answer options (A, B, C) — NO option D
2. Only ONE option is correct
3. Questions must mirror actual FAA ${examType === 'ifr' ? 'IRA' : ''} test style and phrasing
4. Use FAA/ICAO terminology exactly${examType === 'ifr' ? ' as used in the AIM and FARs' : ''}
5. Include practical, scenario-based questions (not just definitions)
6. Mix difficulty: ${difficultyMix}
7. Correct answer must be definitively correct per ${referenceGuide}
${supplementNote}

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "question_text": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "correct_answer": "A",
    "difficulty": "easy",
    "explanation": "2-3 sentence explanation of why the correct answer is right${examType === 'ifr' ? ' and why others are wrong' : ''}.",
    "reference": "14 CFR 91.155 or AIM 3-2-4"
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
    exam_type: examType,
  }))

  const { error } = await admin.from('questions').insert(rows)
  if (error) throw new Error(`DB insert failed: ${error.message}`)

  return rows.length
}
