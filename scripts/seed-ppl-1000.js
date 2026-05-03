/**
 * Seeds ~1000 additional PPL questions across all 9 categories
 * Run: node scripts/seed-ppl-1000.js
 */

const { createClient } = require('@supabase/supabase-js')
const Anthropic = require('@anthropic-ai/sdk')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CATEGORIES = [
  {
    category: 'Regulations',
    topics: 'FAR Part 61 (certificates, ratings, currency, logbooks, endorsements), FAR Part 91 (right of way, lights, speed limits, VFR minimums, fuel requirements, preflight action, careless operation), NTSB 830 (accident reporting, incident definitions), medical certificates, safety pilot requirements, student pilot privileges and limitations',
  },
  {
    category: 'Airspace',
    topics: 'Class A/B/C/D/E/G entry requirements and equipment, VFR weather minimums in each class, TFRs and NOTAMs, special use airspace (prohibited/restricted/warning/MOA/alert), Mode C veil, ADS-B requirements, VFR corridors, airspace above 14,500 MSL, Class E surface areas vs Class E elsewhere',
  },
  {
    category: 'Weather Theory',
    topics: 'Frontal systems (cold, warm, stationary, occluded), fog types (radiation, advection, upslope, steam, frontal), thunderstorm stages and avoidance, stability and instability, temperature/dewpoint spread, lapse rates (standard, dry/moist adiabatic), wind shear, microbursts, density altitude, icing types (rime, clear, mixed), sea breeze/land breeze, mountain wave',
  },
  {
    category: 'Weather Services',
    topics: 'METAR and SPECI decoding (all fields including RMK, RVR, color codes), TAF reading (FM, BECMG, TEMPO, PROB groups), SIGMET and AIRMET (Sierra/Tango/Zulu), PIREPs (UA/UUA), winds aloft forecast FB decoding, graphical forecasts, obtaining weather briefings (standard, abbreviated, outlook), prog charts, convective outlook',
  },
  {
    category: 'Aircraft Performance',
    topics: 'Takeoff distance charts (ground roll and 50-ft obstacle) with pressure altitude, temperature, wind corrections; landing distance charts; density altitude calculation; headwind/crosswind component chart; cruise performance; fuel burn and range; effect of weight on performance; climb gradient; hot/high/heavy scenarios; interpolating performance tables',
  },
  {
    category: 'Weight & Balance',
    topics: 'CG calculation (weight × arm = moment), total moment / total weight = CG, loading envelope (CG within limits at gross weight and zero fuel), effect of aft CG on stability and control, forward CG on stall speed and fuel consumption, baggage limits, moment tables, computing required fuel offload, effect of fuel burn on CG shift, max ramp vs max takeoff weight',
  },
  {
    category: 'Aerodynamics',
    topics: 'Four forces (lift, drag, thrust, weight) in all flight phases, angle of attack and stall, load factor and G-forces in turns, Vg diagram (maneuvering speed, VNE, VNO, VA), adverse yaw and use of rudder, P-factor, torque, spiraling slipstream, gyroscopic precession, ground effect, wake turbulence avoidance, spin entry/recovery, Dutch roll, phugoid oscillation',
  },
  {
    category: 'Flight Instruments',
    topics: 'Pitot-static instruments (altimeter, ASI, VSI) — blockages and errors, gyroscopic instruments (AI, HI, TC) — vacuum vs electric, precession, tumbling, magnetic compass errors (ANDS/OSUN, acceleration/deceleration, turning), altimeter settings (QNH, QFE, standard), service ceiling, absolute ceiling, instrument preflight checks, glass cockpit primary flight display interpretation',
  },
  {
    category: 'Navigation',
    topics: 'VOR navigation (CDI, OBS, TO/FROM, tracking, intercepting), ADF and NDB tracking, GPS RAIM, dead reckoning (TC/TH/MC/MH, wind correction angle, E6B calculations), sectional chart symbols (airspace, airports, obstacles, nav aids, special areas), time/speed/distance calculations, fuel planning, lost procedures, pilotage, time zone conversions, course vs heading',
  },
]

// Multiple topic variants per category to ensure question diversity across batches
const TOPIC_VARIANTS = {
  'Regulations': [
    'Focus on: FAR 91 VFR flight rules, right-of-way, fuel requirements, preflight action, careless operation, basic VFR weather minimums',
    'Focus on: FAR 61 certificates and ratings, endorsements, logbook requirements, currency requirements (day/night/IFR), flight review',
    'Focus on: NTSB 830 accident/incident reporting, medical certificate classes and durations, safety pilot requirements, student pilot limitations',
    'Focus on: Special VFR, Night VFR, operations over congested areas, formation flight, aerobatics, speed limits, light signals, aircraft documents (ARROW)',
  ],
  'Airspace': [
    'Focus on: Class B and Class C airspace — entry, equipment, and communication requirements, Mode C veil',
    'Focus on: Class D and Class E airspace — weather minimums, entry, surface areas, ATC communication requirements',
    'Focus on: Class G airspace — day/night minimums at different altitudes, transitions, uncontrolled airport operations',
    'Focus on: Special use airspace (restricted, MOA, prohibited, warning, alert areas), TFRs, ADS-B requirements, Class A',
  ],
  'Weather Theory': [
    'Focus on: Frontal systems — cold, warm, stationary, occluded characteristics, associated weather and clouds',
    'Focus on: Fog types (radiation, advection, upslope, steam, frontal), how each forms, and pilot actions',
    'Focus on: Thunderstorm development stages, embedded thunderstorms, avoiding cumulonimbus, microbursts',
    'Focus on: Atmospheric stability, lapse rates, density altitude, icing types, mountain wave, wind shear',
  ],
  'Weather Services': [
    'Focus on: METAR decoding — all fields including sky condition, weather codes, RVR, remarks, altimeter',
    'Focus on: TAF reading — validity, FM groups, BECMG, TEMPO, PROB; obtaining weather briefings',
    'Focus on: SIGMETs and AIRMETs (Sierra/Tango/Zulu) — definitions, coverage, pilot actions',
    'Focus on: Winds aloft forecast decoding, PIREPs, prog charts, convective outlook, graphical weather products',
  ],
  'Aircraft Performance': [
    'Focus on: Takeoff distance chart usage — pressure altitude, temperature, weight, headwind corrections, 50-ft obstacle vs ground roll',
    'Focus on: Density altitude calculation, effect on performance, hot/high/heavy scenarios, service ceiling',
    'Focus on: Landing distance — approach speed, flaps, wind corrections, hydroplaning, wet/contaminated runways',
    'Focus on: Cruise performance, fuel burn calculation, range vs endurance, power settings, headwind/tailwind effect on range',
  ],
  'Weight & Balance': [
    'Focus on: Basic CG calculation — weight × arm = moment, total weight, CG determination from table',
    'Focus on: Loading envelope — checking if CG is within limits, maximum gross weight, effect of adding/removing weight',
    'Focus on: Aft CG vs forward CG effects on stability, stall speed, control, fuel efficiency',
    'Focus on: Fuel weight and burn, baggage limits, loading scenarios with shifting cargo, moment index units',
  ],
  'Aerodynamics': [
    'Focus on: Four forces in all phases, angle of attack, stall characteristics, stall speed and load factor relationship',
    'Focus on: Load factor in turns, Vg diagram, maneuvering speed (VA), effect of weight on VA',
    'Focus on: Adverse yaw, p-factor, torque, spiraling slipstream, left-turning tendencies, gyroscopic precession',
    'Focus on: Ground effect, wake turbulence, drag types (parasite/induced), L/D ratio, best glide, minimum sink',
  ],
  'Flight Instruments': [
    'Focus on: Pitot-static system — blockages (pitot blocked, drain hole blocked, static blocked), effects on ASI/altimeter/VSI',
    'Focus on: Magnetic compass errors — ANDS, OSUN, deviation, variation; acceleration/deceleration errors',
    'Focus on: Gyroscopic instruments — vacuum/electric, precession, tumbling, AI and HI errors, TC ball',
    'Focus on: Altimeter settings and errors, temperature effects on altitude, instrument preflight checks, VSI lag',
  ],
  'Navigation': [
    'Focus on: VOR navigation — CDI deflection, TO/FROM, tracking, intercepting a radial, station passage',
    'Focus on: Dead reckoning — TC to TH (variation, deviation, wind correction angle), E6B time/speed/distance, fuel planning',
    'Focus on: Sectional chart reading — airspace depictions, airport symbols, nav aid symbols, obstruction symbols, MEF',
    'Focus on: Lost procedures, diversion to alternate, ADF tracking, GPS RAIM, position reports, ETE/ETA calculations',
  ],
}

async function generateBatch(category, topics, batchNum) {
  const prompt = `Generate exactly 30 FAA Private Pilot Airplane (PAR) knowledge test questions for the category: "${category}".

${topics}

STRICT RULES:
1. Each question must have exactly 3 answer options (A, B, C) — NO option D
2. Only ONE option is correct
3. Questions must mirror actual FAA PAR test style and phrasing exactly
4. Use FAA/ICAO terminology exactly as used in the AIM and FARs
5. Include practical, scenario-based questions (not just definitions)
6. Mix difficulty: ~30% easy, 50% medium, 20% hard
7. Correct answer must be definitively correct per FAR/AIM/PHAK
8. Do NOT repeat questions you might have seen before — generate fresh, unique questions

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
  if (!Array.isArray(questions) || questions.length === 0) throw new Error('Empty array')

  const rows = questions.map(q => ({
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
    exam_type: 'ppl',
  }))

  const { error } = await supabase.from('questions').insert(rows)
  if (error) throw new Error(`DB: ${error.message}`)
  return rows.length
}

async function main() {
  const BATCHES = 4 // 4 batches × 30 questions × 9 categories = 1080 target
  console.log(`TARMAC PPL Seeder — ${BATCHES} batches × 30 × 9 categories = ~${BATCHES * 30 * 9} questions\n`)

  let grandTotal = 0

  for (const { category, topics } of CATEGORIES) {
    const variants = TOPIC_VARIANTS[category]
    let catTotal = 0
    console.log(`\n${category}:`)
    for (let b = 0; b < BATCHES; b++) {
      const topicFocus = variants ? `${topics}\n\n${variants[b % variants.length]}` : topics
      process.stdout.write(`  batch ${b + 1}/${BATCHES}... `)
      try {
        const n = await generateBatch(category, topicFocus, b)
        catTotal += n
        grandTotal += n
        console.log(`✓ ${n}  (cat total: ${catTotal})`)
      } catch (e) {
        console.log(`✗ ${e.message}`)
      }
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Done. ${grandTotal} PPL questions added to the database.\n`)
}

main().catch(e => { console.error(e); process.exit(1) })
