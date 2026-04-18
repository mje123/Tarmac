/**
 * Supplement Question Seeder
 * Generates ~88 questions that require the FAA-CT-8080-2H supplement.
 * Run: node scripts/seed-supplement-questions.js
 */

const { createClient } = require('@supabase/supabase-js')
const Anthropic = require('@anthropic-ai/sdk')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SUPPLEMENT_TARGETS = [
  {
    category: 'Weather Services',
    count: 10,
    figure: 'Figure 12',
    figureDesc: 'Figure 12 shows sample METARs and SPECIs. A typical METAR reads: METAR KORD 121755Z 27014KT 10SM FEW040 BKN250 22/09 A2992 RMK AO2 SLP133. Another shows: SPECI KDFW 151523Z 18035G50KT 3/4SM +TSRA OVC010CB 32/27 A2968 RMK AO2 TSB1458 OCNL LTGICCC. A TAF: TAF KORD 121720Z 1218/1318 27012KT P6SM FEW040 FM1300 30018G28KT 5SM -SHRA BKN025 TEMPO 1302/1306 3SM TSRA OVC015CB.',
    topics: 'Decoding METARs: wind, visibility, clouds, weather, altimeter. Decoding TAFs: validity periods, FM groups, TEMPO groups. SPECI reports. Wind gust notation. Present weather codes (+TSRA, -RA, BR, FG, HZ). Cloud height AGL.',
  },
  {
    category: 'Weather Services',
    count: 8,
    figure: 'Figure 17',
    figureDesc: 'Figure 17 is a Winds Aloft Forecast (FB Winds). STL entries: 3000=2113, 6000=2318+08, 9000=2424+02, 12000=2356-08, 18000=2463-20, 24000=246047. BOS entries: 3000=1707, 6000=2010+10, 9000=2118+06, 12000=2321-01. Wind code format: first 2 digits = direction/10 (e.g. 23 = 230°), next 2 = speed knots, then +/- temperature °C. "9900" means winds light and variable.',
    topics: 'Reading winds aloft forecasts: decoding 4-digit wind codes, direction in true degrees, speed in knots, temperature in Celsius. Identify highest winds, most favorable winds. Compare winds at different altitudes. Light and variable notation.',
  },
  {
    category: 'Aircraft Performance',
    count: 10,
    figure: 'Figure 8',
    figureDesc: 'Figure 8 is a Density Altitude Chart. Y-axis: pressure altitude 0-14,000 ft. X-axis: OAT in °F (-60 to +120°F). Diagonal lines show density altitude. Key readings: PA=3000/OAT=80°F → DA≈5,800 ft. PA=5000/OAT=100°F → DA≈8,700 ft. PA=0/OAT=59°F → DA=0 (standard). PA=2000/OAT=50°F → DA≈2,800 ft. PA=7000/OAT=90°F → DA≈10,000 ft. PA=4000/OAT=70°F → DA≈6,300 ft. PA=6000/OAT=40°F → DA≈6,600 ft.',
    topics: 'Reading density altitude chart with specific pressure altitude and temperature values. Effect of high density altitude on aircraft performance. Calculating density altitude from pressure altitude and temperature. Recognizing dangerous high-DA conditions.',
  },
  {
    category: 'Aircraft Performance',
    count: 10,
    figure: 'Figure 38',
    figureDesc: 'Figure 38 shows Cessna 172 landing performance. GROUND ROLL at sea level/59°F calm: 500 ft. At 2000 ft PA/59°F: 545 ft. At 4000 ft/77°F: 595 ft. At 5000 ft/101°F calm: 545 ft; with 8-kt headwind: ≈490 ft. TOTAL DISTANCE OVER 50-FT OBSTACLE: sea level standard calm: 1,250 ft. At 4000 ft/77°F: 1,340 ft. At 5000 ft/41°F 8-kt headwind hard surface: 956 ft. Headwind correction: subtract 10% of distance per 9-kt headwind. Uphill slope 1%: add 10%. Note: charts assume short-field technique.',
    topics: 'Using landing distance charts with pressure altitude, temperature, headwind. Effect of headwind on ground roll. Total distance over 50-ft obstacle vs ground roll only. Effect of temperature on landing performance. Tailwind corrections.',
  },
  {
    category: 'Weight & Balance',
    count: 10,
    figure: 'Figures 32 and 33',
    figureDesc: 'Figures 32-33: Cessna 172 weight and balance. Max gross: 2,550 lbs. Empty wt: 1,393 lbs, arm 39.3 in, moment 54,726. Stations: front seats arm=37", rear seats arm=73", fuel (main) arm=48" @ 6 lb/gal, baggage A arm=95" (max 120 lbs), baggage B arm=123" (max 50 lbs). Forward CG limit: 35.0" at 2,050-2,550 lbs. Aft CG limit: 47.3" at all weights. CG formula: Total Moment ÷ Total Weight = CG in inches from datum.',
    topics: 'Calculate total weight and moment from given loading. Determine CG and check against limits. Calculate fuel to drain to fix overweight or CG issue. Effect of fuel burn on CG. Determine if baggage configuration is within limits.',
  },
  {
    category: 'Navigation',
    count: 12,
    figure: 'Figure 26',
    figureDesc: 'Figure 26 sectional: Cooperstown-Westville Airport (08D) private, 1,523 ft MSL, runway 12/30, 2,600 ft. Class G airspace. Magenta vignette: Class E begins at 700 AGL. Jamestown Regional (JMS) nearby with Class D dashed blue circle, tower 119.2. VOR/DME at Jamestown (JMS). Restricted area R-5001 to north (altitude: surface to FL 180). No fuel at 08D. The area has maximum elevation figure of 26 (2,600 ft). Magnetic variation in area approximately 10° E.',
    topics: 'Identify airspace class from sectional chart shading. Read airport information (elevation, runway length). Identify navigation aids from symbols. Special use airspace operations. VFR cloud clearance and visibility at Cooperstown. Distance and direction. Maximum elevation figures.',
  },
  {
    category: 'Navigation',
    count: 10,
    figure: 'Figure 52',
    figureDesc: 'Figure 52 sectional: Lincoln Municipal (LNK) Class C — inner core 5NM surface to 4,200 MSL, outer shelf 10NM 1,200-4,200 MSL. Elev 1,219 ft MSL. Frequencies: Tower 118.5 (CTAF when closed), Approach 124.0, Ground 121.9, ATIS 119.25. Loup City Municipal: northeast of city ~3 NM, 1,960 ft MSL, private, no services. Minneapolis Center 128.75 above Class C. Norfolk Regional to the northeast.',
    topics: 'Class C airspace dimensions and entry requirements. Identify correct frequencies for approach, tower, ground, CTAF. Communications when tower closed (CTAF). Location of airports relative to reference cities. Required transponder and ADS-B in Class C. Procedures for landing at Lincoln when tower open vs. closed.',
  },
  {
    category: 'Navigation',
    count: 12,
    figure: 'Figures 64, 65, 66, and 67',
    figureDesc: 'Figure 64: Runway hold-short markings (4 yellow lines: 2 solid, 2 dashed). Solid side = runway side (must hold). Dashed side = taxiway side. Figure 65: Direction/location signs. Black on yellow = direction sign (with arrow). Yellow on black = location sign (where you are). Figure 66: Runway designation sign — white on red = mandatory instruction sign (you are on or approaching runway). Figure 67: ILS hold-short sign (white on red). Also: vehicle lane = dashed white lines. Displaced threshold = white arrows before threshold bar. Taxiway centerline = single yellow line.',
    topics: 'Identify mandatory instruction signs (white on red background). Identify location signs (yellow on black). Direction signs (black on yellow). Hold-short marking orientation — which side to stop on. Displaced threshold markings and what operations are permitted. ILS critical area signs and when to hold short. Enhanced centerline markings.',
  },
  {
    category: 'Airspace',
    count: 8,
    figure: 'Figure 20',
    figureDesc: 'Figure 20 sectional: NALF Fentress (NFE) is a military airfield. No Class D dashed blue circle = not Class D. Magenta airport symbol with no services shown. Magenta shading around the field = Class E begins at 700 ft AGL. The area north of Norfolk NAS (NGU) which has Class D (dashed blue circle) and tower 119.025. Norfolk International (ORF) has Class C (solid blue circle). Restricted areas R-6604A and R-6604B are nearby (to the east). The NFE airfield has IFR departure procedures but no published approach control.',
    topics: 'Identify airspace class from sectional chart symbols: magenta dashed circle = Class E surface, blue dashed circle = Class D, solid blue circle with inner/outer = Class C. What airspace exists at NFE (Class E, not Class D). VFR weather minimums in Class E vs G. Operations in restricted areas. Reading military airport symbols.',
  },
  {
    category: 'Flight Instruments',
    count: 8,
    figure: 'Figures 3, 4, 5, 6, and 7',
    figureDesc: 'Figure 3 (Altimeter): Kollsman window set to 29.95. Three hands: long = hundreds, short = thousands, medium = ten-thousands. Reading ≈ 8,500 ft. Figure 4 (Airspeed): White arc 48-100 kts (flap range Vso to Vfe), green arc 65-165 kts (normal Vs1 to Vno), yellow arc 165-208 kts (caution to VNE), red line 208 kts VNE, blue radial 76 kts (Vy). Currently showing ≈105 kts. Figure 5 (Turn Coordinator): Standard rate left turn, ball displaced right (step on ball to center = right rudder needed). Figure 6 (Heading Indicator): Reading 270° (west). Figure 7 (Attitude Indicator): 10° nose-up, 20° left bank shown.',
    topics: 'Read altimeter: identify altitude and Kollsman setting. Identify colored arcs on airspeed indicator and what they mean (VNE, VNO, VS1, VSO, VFE). Interpret turn coordinator: standard rate, direction of turn, ball indicating slip/skid. Read heading indicator. Read attitude indicator pitch and bank. Identify instrument failures.',
  },
]

async function generateSupplementQuestions({ category, count, figure, figureDesc, topics }) {
  const prompt = `Generate exactly ${count} FAA Private Pilot Airplane (PAR) knowledge test questions that require the student to refer to ${figure} from the FAA Airman Knowledge Testing Supplement (FAA-CT-8080-2H).

FIGURE DESCRIPTION (use this data to create realistic, accurate questions):
${figureDesc}

TOPICS TO COVER:
${topics}

STRICT RULES:
1. Every question_text MUST start with "(Refer to FAA-CT-8080-2H, ${figure}.)"
2. Each question must have exactly 3 answer options (A, B, C) — NO option D
3. Only ONE option is correct — definitively correct based on the figure data above
4. Wrong answers must be plausible (common student errors, close numeric values)
5. Mirror actual FAA test phrasing exactly
6. Use specific numeric values from the figure description
7. Mix difficulty: ~30% easy, 50% medium, 20% hard
8. Explanation must teach HOW to read the chart, not just state the answer

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "question_text": "(Refer to FAA-CT-8080-2H, ${figure}.) ...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "correct_answer": "A",
    "difficulty": "medium",
    "explanation": "Step-by-step: locate [X on chart], then [read Y value]. Common error: [Z]. Reference: [rule/data].",
    "reference": "FAA-CT-8080-2H, ${figure}"
  }
]`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) { console.error(`  Failed to parse JSON for ${figure}`); return [] }

  try {
    const questions = JSON.parse(match[0])
    return questions.map(q => ({ ...q, option_d: null, category }))
  } catch (e) {
    console.error(`  JSON parse error for ${figure}:`, e.message)
    return []
  }
}

async function insertQuestions(questions) {
  const { error } = await supabase.from('questions').insert(
    questions.map(q => ({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: '',
      correct_answer: q.correct_answer,
      category: q.category,
      difficulty: q.difficulty || 'medium',
      explanation: q.explanation,
      reference: q.reference || null,
    }))
  )
  if (error) { console.error('  Insert error:', error.message); return 0 }
  return questions.length
}

async function main() {
  console.log('📋 TARMAC Supplement Question Seeder\n')

  const { error } = await supabase.from('questions').select('id').limit(1)
  if (error) { console.error('❌ DB connection failed:', error.message); process.exit(1) }

  const { count: before } = await supabase.from('questions').select('id', { count: 'exact', head: true })
  console.log(`Starting questions: ${before}\n`)

  let total = 0
  for (const target of SUPPLEMENT_TARGETS) {
    try {
      const generated = await generateSupplementQuestions(target)
      if (generated.length > 0) {
        const n = await insertQuestions(generated)
        total += n
        console.log(`✅ ${target.figure} (${target.category}): ${n} questions added`)
      }
      await new Promise(r => setTimeout(r, 1200))
    } catch (e) {
      console.error(`❌ ${target.figure} failed:`, e.message)
    }
  }

  const { count: after } = await supabase.from('questions').select('id', { count: 'exact', head: true })
  console.log(`\n🎉 Done! Added ${total} supplement questions.`)
  console.log(`Total questions in database: ${after}`)
}

main().catch(console.error)
