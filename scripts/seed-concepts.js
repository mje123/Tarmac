/**
 * TARMAC Concept Seeder — question-engine foundation
 * Seeds the full concept set (one per PAR and IRA written-test category) and their
 * archetypes into `concepts` / `question_archetypes`. Run after applying the
 * question-engine migrations in the Supabase SQL editor / via psql.
 *
 * Mirrors src/lib/generation/concepts.ts — keep the two in sync if you edit either.
 * (Duplicated here, not imported, because this is a plain Node/CommonJS script and
 * concepts.ts is TypeScript, matching the existing scripts/seed-*.js convention of
 * inlining their own data rather than importing from src/.)
 *
 * Run: node scripts/seed-concepts.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const CONCEPTS = [
  {
    slug: 'density_altitude',
    exam_type: 'ppl',
    acs_area: 'Aircraft Performance',
    acs_task: 'PA.VI.A — Performance and Limitations: Density Altitude',
    category: 'Aircraft Performance',
    name: 'Density Altitude',
    authoritative_source: 'FAA-H-8083-25C, Chapter 10 (Aircraft Performance)',
    rule_summary:
      'Density altitude is pressure altitude corrected for nonstandard temperature. It is the altitude in the standard atmosphere at which the air has the same density as the actual air at the location in question. ' +
      'Pressure altitude = field elevation adjusted so that a 1 inHg deviation from 29.92 inHg = 1,000 ft (subtract 1,000 ft per inch above 29.92, add 1,000 ft per inch below). ' +
      'The ISA (standard) temperature at a given pressure altitude = 15°C − (2°C × pressure altitude in thousands of feet). ' +
      'Rule of thumb used for FAA-style estimation: density altitude ≈ pressure altitude + [120 ft × (actual temperature °C − ISA temperature °C at that pressure altitude)]. ' +
      'As density altitude increases (higher elevation, higher temperature, higher humidity, lower pressure), air density decreases, which: increases takeoff and landing distance, reduces climb rate, reduces engine power (normally aspirated engines) and propeller efficiency, and increases true airspeed for a given indicated airspeed. High density altitude is most dangerous when combined with a short/high-elevation runway, high aircraft weight, and obstacles on departure.',
    common_misconceptions:
      'Students often confuse density altitude with pressure altitude (forgetting the temperature correction), assume humidity\'s effect is large when it is actually secondary to temperature and elevation, or assume higher density altitude improves performance because "the air is thinner so there\'s less drag" — it does not; reduced air density reduces lift and engine/propeller performance, which degrades performance overall.',
    variables: ['field_elevation', 'altimeter_setting', 'temperature', 'humidity', 'aircraft_weight', 'runway_length', 'wind', 'aircraft_type'],
    archetypes: [
      { scenario_type: 'calculation', cognitive_level: 'application', template_prompt: 'Give a pressure altitude and temperature (or field elevation + altimeter setting + temperature) and ask the student to determine density altitude or the resulting performance effect. Use round, FAA-test-realistic numbers.' },
      { scenario_type: 'comparison', cognitive_level: 'scenario', template_prompt: 'Describe two airports or two conditions at the same airport (e.g. morning vs. afternoon, or two different elevations/temperatures) and ask which produces the greater density altitude / greater performance penalty, and why.' },
      { scenario_type: 'operational_decision', cognitive_level: 'scenario', template_prompt: 'Describe a realistic departure scenario (elevation, temperature, runway length, aircraft weight, obstacles) and ask the student to identify the correct operational decision or the primary performance concern — not a bare number.' },
      { scenario_type: 'interpretation', cognitive_level: 'transfer', template_prompt: 'Ask the student to identify which single additional piece of information would most affect the density altitude / performance conclusion in a described scenario, without asking them to calculate a number at all.' },
    ],
  },
  {
    slug: 'airspace_classification_minimums',
    exam_type: 'ppl',
    acs_area: 'National Airspace System',
    acs_task: 'PA.III.A — National Airspace System: Airspace Classes and VFR Weather Minimums',
    category: 'Airspace',
    name: 'Airspace Classification & VFR Weather Minimums',
    authoritative_source: 'FAA-H-8083-25C, Chapter 15 (Airspace); 14 CFR 91.155',
    rule_summary:
      'Class A (18,000 ft MSL up to FL600): IFR only, no VFR weather minimums apply. Class B: requires an explicit ATC clearance to enter (not just radio contact); VFR minimums within it are 3 SM visibility, clear of clouds. Class C and D: require two-way radio communication established before entry; VFR minimums are 3 SM visibility, 500 ft below/1,000 ft above/2,000 ft horizontal from clouds. Class E: below 10,000 ft MSL, 3 SM / 500-1,000-2,000; at or above 10,000 ft MSL AND more than 1,200 ft AGL, minimums increase to 5 SM visibility and 1,000 ft below/1,000 ft above/1 SM horizontal from clouds. Class G (uncontrolled): at or below 1,200 ft AGL, day minimums are 1 SM visibility and clear of clouds, but night minimums step up to 3 SM / 500-1,000-2,000 (same as controlled airspace); above 1,200 ft AGL but below 10,000 ft MSL, Class G minimums are 1 SM / 500-1,000-2,000 by day and 3 SM / 500-1,000-2,000 by night.',
    common_misconceptions:
      'Students often apply Class G day minimums (1 SM, clear of clouds) to nighttime operations, forget that Class B requires a clearance rather than merely establishing radio contact (which is only required for C/D), and treat Class E minimums as constant regardless of altitude, missing the jump in requirements at and above 10,000 ft MSL / 1,200 ft AGL.',
    variables: ['airspace_class', 'altitude_agl', 'altitude_msl', 'time_of_day', 'visibility', 'cloud_clearance'],
    archetypes: [
      { scenario_type: 'application', cognitive_level: 'application', template_prompt: 'Describe an aircraft operating in a specific airspace class at a specific altitude and time of day, and ask for the required flight visibility and/or cloud clearance.' },
      { scenario_type: 'comparison', cognitive_level: 'scenario', template_prompt: 'Compare two airspace classes or two altitudes/times of day in the same class, and ask which has the more restrictive (or less restrictive) VFR weather minimums, and why.' },
      { scenario_type: 'entry_requirement', cognitive_level: 'scenario', template_prompt: 'Describe a pilot approaching a specific class of airspace and ask what is required before entry (e.g. clearance vs. two-way radio contact vs. nothing).' },
      { scenario_type: 'interpretation', cognitive_level: 'transfer', template_prompt: 'Ask which single change (altitude crossing 1,200 ft AGL or 10,000 ft MSL, or a shift from day to night) would change the required minimums in a described scenario, without simply restating the rule.' },
    ],
  },
  {
    slug: 'weather_theory_stability_fronts',
    exam_type: 'ppl',
    acs_area: 'Weather Information',
    acs_task: 'PA.VII.A — Weather Information: Atmospheric Stability, Fronts, and Cloud Formation',
    category: 'Weather Theory',
    name: 'Atmospheric Stability, Fronts & Cloud Base',
    authoritative_source: 'FAA-H-8083-25C, Chapter 12 (Weather Theory)',
    rule_summary:
      'Stable air resists vertical motion and produces smooth flight, stratiform (layered) clouds, poor visibility from haze, and steady precipitation; unstable air favors vertical motion and produces turbulence, cumuliform (towering) clouds, good visibility, and showery precipitation. ' +
      'A cold front (fast-moving, steep frontal slope) typically brings a narrow band of more intense weather; a warm front (slow-moving, shallow slope) brings widespread precipitation and lowering ceilings well ahead of frontal passage; an occluded front combines characteristics of both. ' +
      'Convective (cumulus) cloud base height rule of thumb: cloud base (ft AGL) ≈ [(temperature °C − dewpoint °C) / 2.5] × 1,000 — a SMALLER temperature-dewpoint spread means a LOWER cloud base, not higher, because the air needs to rise less before reaching saturation. ' +
      'Structural icing forms in visible moisture at or below freezing; clear ice (large supercooled droplets, often freezing rain) is harder to remove than rime ice (small supercooled droplets, typically in stratus clouds).',
    common_misconceptions:
      'Students frequently invert the temperature-dewpoint spread rule, assuming a LARGE spread means clouds are close to the surface when the opposite is true (a small spread means a low cloud base). They also assume cold fronts are always more hazardous than warm fronts, and confuse stable-air cloud types (stratiform) with unstable-air cloud types (cumuliform).',
    variables: ['temperature_c', 'dewpoint_c', 'stability', 'front_type', 'cloud_type'],
    archetypes: [
      { scenario_type: 'calculation', cognitive_level: 'application', template_prompt: 'Give a surface temperature and dewpoint and ask the student to estimate the convective cloud base in feet AGL using the standard rule of thumb.' },
      { scenario_type: 'comparison', cognitive_level: 'scenario', template_prompt: 'Describe stable vs. unstable air conditions (or a cold vs. warm front) and ask the student to identify which produces which type of clouds/turbulence/precipitation.' },
      { scenario_type: 'scenario', cognitive_level: 'scenario', template_prompt: 'Describe an approaching frontal system with observable cues (wind shift, pressure trend, cloud sequence) and ask the student to identify the front type or predict the weather change.' },
      { scenario_type: 'interpretation', cognitive_level: 'transfer', template_prompt: 'Ask which single additional piece of information (temperature trend, dewpoint trend, wind shift) would most change the cloud-base or stability conclusion in a described scenario.' },
    ],
  },
  {
    slug: 'metar_taf_decoding',
    exam_type: 'ppl',
    acs_area: 'Weather Information',
    acs_task: 'PA.VII.B — Weather Information: METAR, TAF, and Aviation Weather Reports',
    category: 'Weather Services',
    name: 'METAR & TAF Decoding',
    authoritative_source: 'FAA-H-8083-25C, Chapter 13 (Aviation Weather Services); AIM 7-1-28',
    rule_summary:
      'A METAR reports: station identifier, day/time (UTC), wind (direction/speed/gust in knots, or 00000KT for calm), visibility (statute miles), present weather, sky condition as layers with height in hundreds of feet AGL (FEW = 1–2 oktas, SCT = 3–4, BKN = 5–7, OVC = 8), temperature/dewpoint (°C), altimeter setting (inHg), and remarks. ' +
      'The reported "ceiling" is the height of the LOWEST layer reported as BKN or OVC (or vertical visibility in an obscuration) — FEW and SCT layers do not constitute a ceiling. ' +
      'A TAF uses the same coding conventions for a forecast valid period, with change groups: FM (from a specific time, rapid/significant change), BECMG (gradual change over a time range), TEMPO (temporary fluctuations expected to last less than an hour at a time, not a permanent change), and PROB30/PROB40 (probability of the described conditions).',
    common_misconceptions:
      'Students often count a FEW or SCT layer as a "ceiling" when only BKN/OVC layers qualify, misread TEMPO as describing a permanent change rather than a temporary fluctuation, and confuse gust notation (e.g. 18025G35KT) with a wind direction range.',
    variables: ['metar_string', 'taf_string', 'sky_condition', 'wind_group', 'visibility_group', 'change_group'],
    archetypes: [
      { scenario_type: 'interpretation', cognitive_level: 'application', template_prompt: 'Give a realistic METAR or TAF string and ask the student to decode one specific field (ceiling, visibility, wind, or a TAF change group).' },
      { scenario_type: 'application', cognitive_level: 'scenario', template_prompt: 'Give a METAR and ask the student to determine the flight category (VFR/MVFR/IFR/LIFR) implied by the reported ceiling and visibility.' },
      { scenario_type: 'scenario', cognitive_level: 'scenario', template_prompt: 'Give a TAF with multiple change groups (FM/TEMPO/BECMG) and ask what conditions are expected at a specific time within the valid period.' },
      { scenario_type: 'interpretation', cognitive_level: 'transfer', template_prompt: 'Ask the student to identify which single element of a given METAR/TAF is being misread in a described (incorrect) interpretation, and why it is wrong.' },
    ],
  },
  {
    slug: 'weight_balance_cg',
    exam_type: 'ppl',
    acs_area: 'Weight and Balance',
    acs_task: 'PA.VI.B — Performance and Limitations: Weight and Balance',
    category: 'Weight & Balance',
    name: 'Weight & Balance / Center of Gravity',
    authoritative_source: 'FAA-H-8083-25C, Chapter 10 (Weight and Balance)',
    rule_summary:
      'Moment = weight × arm (arm is the horizontal distance from the reference datum). Center of gravity (CG), in inches from the datum, = total moment ÷ total weight, where total moment is the sum of every station\'s moment (the empty aircraft\'s moment is normally given directly in its weight-and-balance data rather than as weight×arm). ' +
      'CG must fall within the forward and aft limits published in the POH/AFM weight-and-balance envelope for the aircraft\'s actual gross weight — being under max gross weight does NOT by itself guarantee the CG is within limits. ' +
      'An aft-of-limit CG reduces longitudinal stability, increases stall speed less predictably, and can make spin recovery difficult or impossible; a forward-of-limit CG increases stall speed, requires more back-elevator pressure, and can make flare/landing (or even takeoff rotation) difficult. ' +
      'Because fuel burns off during flight, CG should be checked for both the takeoff condition and the estimated landing condition — a load that is within limits at takeoff is not guaranteed to remain within limits after fuel burn shifts the CG.',
    common_misconceptions:
      'Students often confuse "arm" (a distance) with "moment" (weight × arm), assume being under max gross weight is sufficient without checking the CG envelope, and forget to check CG at the landing weight/configuration as well as at takeoff, since burning off fuel from a tank forward or aft of the CG will shift it.',
    variables: ['empty_weight', 'empty_moment', 'pilot_weight', 'pilot_arm', 'fuel_weight', 'fuel_arm', 'baggage_weight', 'baggage_arm'],
    archetypes: [
      { scenario_type: 'calculation', cognitive_level: 'application', template_prompt: 'Give a loading table (empty weight/moment, pilot weight+arm, fuel weight+arm, baggage weight+arm) and ask the student to compute total weight, total moment, or the resulting CG in inches from datum.' },
      { scenario_type: 'operational_decision', cognitive_level: 'scenario', template_prompt: 'Give a computed CG and a published envelope, and ask whether the loading is within limits, and if not, what would bring it within limits (e.g. removing baggage, moving a passenger).' },
      { scenario_type: 'scenario', cognitive_level: 'scenario', template_prompt: 'Describe a loading change during a flight (fuel burn, dropping off a passenger) and ask which direction the CG shifts and whether it remains within limits.' },
      { scenario_type: 'interpretation', cognitive_level: 'transfer', template_prompt: 'Ask which single loading change (which station\'s weight, or fuel burn) would move the CG the furthest toward the forward or aft limit in a described scenario.' },
    ],
  },
  {
    slug: 'aerodynamics_load_factor',
    exam_type: 'ppl',
    acs_area: 'Principles of Flight',
    acs_task: 'PA.VIII.C — Basic Aerodynamics: Load Factors',
    category: 'Aerodynamics',
    name: 'Load Factor & Bank Angle',
    authoritative_source: 'FAA-H-8083-25C, Chapter 5 (Aerodynamics of Flight)',
    rule_summary:
      'In a coordinated, level, constant-altitude turn, load factor (n) = 1 ÷ cos(bank angle). This relationship is NOT linear — load factor increases slowly at shallow bank angles and very rapidly beyond about 60°. ' +
      'Stall speed increases with the square root of load factor (stall speed in the turn = level-flight stall speed × √n), so a doubling of load factor does not double stall speed. ' +
      'Normal-category aircraft are certificated to a positive limit load factor of +3.8g (utility category typically +4.4g, aerobatic +6.0g); exceeding the limit load factor risks structural damage. ' +
      'Load factor also increases from turbulence/gusts independent of bank angle, and the two effects (bank-induced and gust-induced) can combine.',
    common_misconceptions:
      'Students often assume load factor scales linearly with bank angle (e.g. doubling bank angle doubles load factor) when the actual relationship is 1/cos(bank) and accelerates sharply past 45–60°, and they frequently believe stall speed increases by the same factor as load factor rather than by its square root.',
    variables: ['bank_angle_deg', 'load_factor', 'stall_speed_increase'],
    archetypes: [
      { scenario_type: 'calculation', cognitive_level: 'application', template_prompt: 'Give a bank angle in a coordinated level turn and ask the student to determine the resulting load factor.' },
      { scenario_type: 'comparison', cognitive_level: 'scenario', template_prompt: 'Compare two bank angles (e.g. 30° vs. 60°) and ask which produces the greater load factor or stall-speed increase, and by roughly how much.' },
      { scenario_type: 'scenario', cognitive_level: 'scenario', template_prompt: 'Describe a steep turn near maneuvering speed or near a stall warning, and ask the student to identify the correct corrective action.' },
      { scenario_type: 'interpretation', cognitive_level: 'transfer', template_prompt: 'Ask the student to identify which additional factor (turbulence, further increased bank, aircraft category limit) would be most relevant to whether a described maneuver is safe.' },
    ],
  },
  {
    slug: 'flight_instruments_pitot_static',
    exam_type: 'ppl',
    acs_area: 'Aircraft Systems',
    acs_task: 'PA.IX.A — Aircraft Systems: Pitot-Static and Gyroscopic Instruments',
    category: 'Flight Instruments',
    name: 'Pitot-Static & Gyroscopic Instrument Failures',
    authoritative_source: 'FAA-H-8083-25C, Chapter 8 (Flight Instruments)',
    rule_summary:
      'The airspeed indicator uses BOTH pitot (dynamic) and static pressure; the altimeter and vertical speed indicator use static pressure ONLY. A blocked pitot tube (with the static system and drain hole still open) makes the airspeed indicator behave like an altimeter — it will show an increase in "airspeed" during a climb and a decrease during a descent, regardless of true airspeed. A blocked static port affects the altimeter (freezes at the last valid pressure/altitude), VSI (freezes at zero), and airspeed indicator (becomes unreliable) together, since all three share the static source. Using an alternate static source (in an unpressurized cabin) typically exposes the system to slightly lower ambient pressure, causing the altimeter to read slightly HIGH, the VSI to show a momentary climb, and the airspeed indicator to read slightly high in most airplanes. Gyroscopic instruments are commonly split across power sources on purpose: the attitude indicator and heading indicator are typically vacuum-driven, while the turn coordinator is typically electric — so a vacuum-pump failure does not take out the turn coordinator, and cross-checking it against the attitude/heading indicators is how a vacuum failure is normally caught.',
    common_misconceptions:
      'Students often assume a blocked pitot tube affects the altimeter (it does not — the altimeter is static-only), forget that a blocked static port affects all three static instruments simultaneously rather than just one, and assume all gyroscopic instruments would fail together rather than recognizing the deliberate vacuum/electric split.',
    variables: ['blocked_instrument', 'static_source', 'gyro_power_source'],
    archetypes: [
      { scenario_type: 'fault_diagnosis', cognitive_level: 'application', template_prompt: 'Describe symptoms consistent with a blocked pitot tube or a blocked static port during a climb or descent, and ask the student to identify the failure and which instrument(s) are affected.' },
      { scenario_type: 'scenario', cognitive_level: 'scenario', template_prompt: 'Describe switching to the alternate static source and ask what change the pilot should expect to see on the altimeter, VSI, or airspeed indicator.' },
      { scenario_type: 'fault_diagnosis', cognitive_level: 'transfer', template_prompt: 'Describe a gyroscopic instrument disagreement (e.g. attitude indicator vs. turn coordinator) and ask the student to identify which instrument is most likely correct and why, based on power source.' },
      { scenario_type: 'comparison', cognitive_level: 'scenario', template_prompt: 'Compare two instrument failures (pitot vs. static, vacuum vs. electrical) and ask which instruments are affected by each.' },
    ],
  },
  {
    slug: 'navigation_time_speed_distance',
    exam_type: 'ppl',
    acs_area: 'Navigation',
    acs_task: 'PA.V.A — Navigation: Pilotage and Dead Reckoning',
    category: 'Navigation',
    name: 'Time, Speed, Distance & Groundspeed',
    authoritative_source: 'FAA-H-8083-25C, Chapter 16 (Navigation)',
    rule_summary:
      'Time enroute in minutes = (distance in NM ÷ groundspeed in knots) × 60. Groundspeed is true airspeed corrected for the wind component along the flight path — a direct headwind subtracts from TAS to give groundspeed; a direct tailwind adds to it. Fuel required for a leg = time enroute × fuel burn rate. On a sectional chart, true course is measured against a meridian, then corrected for magnetic variation (found on isogonic lines) to get magnetic course, then further corrected for wind (wind correction angle) to get the magnetic heading actually flown.',
    common_misconceptions:
      'Students often forget to convert the time-speed-distance formula\'s result from a fraction of an hour into minutes, confuse true airspeed with groundspeed once wind is introduced, and apply the "east is least, west is best" variation-correction mnemonic backward.',
    variables: ['distance_nm', 'groundspeed_kts', 'true_airspeed', 'wind_component', 'fuel_burn_rate'],
    archetypes: [
      { scenario_type: 'calculation', cognitive_level: 'application', template_prompt: 'Give a distance in NM and a groundspeed in knots, and ask the student to compute time enroute in minutes.' },
      { scenario_type: 'scenario', cognitive_level: 'scenario', template_prompt: 'Extend the time-enroute calculation into a fuel-planning scenario — given a fuel burn rate, ask whether the flight can be completed with required reserves.' },
      { scenario_type: 'comparison', cognitive_level: 'scenario', template_prompt: 'Compare two groundspeeds (or headwind vs. tailwind legs) over the same distance and ask which arrives sooner or burns less fuel.' },
      { scenario_type: 'interpretation', cognitive_level: 'transfer', template_prompt: 'Ask which single change (wind shift, groundspeed change, distance change) would most affect the time-enroute or fuel-planning conclusion in a described scenario.' },
    ],
  },
  {
    slug: 'regulations_currency',
    exam_type: 'ppl',
    acs_area: 'Preflight Preparation',
    acs_task: 'PA.I.A — Preflight Preparation: Pilot Qualifications and Required Documents',
    category: 'Regulations',
    name: 'Pilot Currency & Required Documents',
    authoritative_source: '14 CFR 61.56, 61.57; FAA-H-8083-25C, Chapter 1',
    rule_summary:
      '14 CFR 61.56 requires a flight review every 24 calendar months to act as pilot in command, unless the pilot has completed qualifying training/certification in that period. 14 CFR 61.57 requires 3 takeoffs and landings in the preceding 90 days (in an aircraft of the same category, class, and type if a type rating is required) to carry passengers; night passenger-carrying currency additionally requires those 3 takeoffs and landings to be FULL-STOP and to occur during the night currency window (1 hour after sunset to 1 hour before sunrise) — day currency does not require full-stop landings and uses a different (daytime) window. Required aircraft documents are commonly remembered as ARROW: Airworthiness certificate, Registration, Radio station license (if operating internationally), Operating limitations (POH/AFM or placards), and Weight-and-balance data.',
    common_misconceptions:
      'Students often apply the day passenger-carrying currency rule (touch-and-go landings count) to night operations, where only full-stop landings within the specific night window count, and they sometimes confuse the flight-review interval (24 calendar months) with the medical certificate or currency intervals, which run on different clocks.',
    variables: ['flight_review_date', 'landings_count', 'landing_type', 'time_of_day', 'aircraft_category_class'],
    archetypes: [
      { scenario_type: 'application', cognitive_level: 'application', template_prompt: 'Describe a pilot\'s recent flight history (dates, number and type of landings, day/night) and ask whether they are current to carry passengers on a specific flight.' },
      { scenario_type: 'scenario', cognitive_level: 'scenario', template_prompt: 'Describe a preflight document check and ask which required document is missing or what ARROW item applies.' },
      { scenario_type: 'fault_diagnosis', cognitive_level: 'transfer', template_prompt: 'Describe a pilot who believes they are current (e.g. did touch-and-goes at night) and ask the student to identify why that reasoning is incorrect.' },
      { scenario_type: 'comparison', cognitive_level: 'scenario', template_prompt: 'Compare day vs. night passenger-carrying currency requirements, or flight-review vs. medical-certificate intervals, and ask which applies to a described situation.' },
    ],
  },
  {
    slug: 'vor_radial_interpretation',
    exam_type: 'ifr',
    acs_area: 'Navigation Systems',
    acs_task: 'IR.VI.A — Air Navigation Systems: VOR',
    category: 'Instrument Navigation',
    name: 'VOR Radial Interpretation',
    authoritative_source: 'FAA-H-8083-15B, Chapter 7 (Navigation); AIM 1-1-3',
    rule_summary:
      'A VOR radial is a magnetic course FROM the station, numbered 000–360. The CDI (course deviation indicator) shows deviation from a selected course TO or FROM the station; centering the needle with a FROM indication on a given course means the aircraft is on that radial. ' +
      'To determine the radial the aircraft is currently on: tune and identify the VOR, then rotate the OBS until the CDI centers with a FROM flag — the course selected is the radial. ' +
      'To fly TO the station on a given radial, the pilot flies the reciprocal course (radial ± 180°) inbound. ' +
      'Reverse sensing occurs when the OBS is set to a course roughly opposite the aircraft\'s actual position/heading relative to the station relative to the selected TO/FROM sense — CDI deflection then indicates the wrong direction of correction. ' +
      'Standard VOR service volume and accuracy tolerances (per AIM 1-1-3) mean radial indications are considered accurate within the station\'s designated service volume; signal reliability degrades at low altitude/long range beyond that volume.',
    common_misconceptions:
      'Students often confuse "radial FROM" with "course TO," fly the wrong reciprocal, or misdiagnose reverse sensing as a VOR malfunction rather than an OBS/TO-FROM setup error. Another common error is assuming the CDI needle shows heading rather than lateral deviation from the selected course.',
    variables: ['aircraft_position', 'selected_course', 'to_from_indication', 'cdi_deflection', 'station_identifier', 'aircraft_heading', 'wind'],
    archetypes: [
      { scenario_type: 'interpretation', cognitive_level: 'application', template_prompt: 'Describe a CDI/OBS/TO-FROM indication and ask the student to determine which radial the aircraft is on, or which direction to turn to intercept a given radial.' },
      { scenario_type: 'scenario', cognitive_level: 'scenario', template_prompt: 'Describe an in-flight navigation scenario (position relative to a VOR, desired course) and ask the student to identify the correct OBS setting or the correct inbound/outbound course to fly.' },
      { scenario_type: 'fault_diagnosis', cognitive_level: 'transfer', template_prompt: 'Describe CDI behavior consistent with reverse sensing or an OBS set to the wrong course, and ask the student to diagnose the cause — not simply read a needle.' },
      { scenario_type: 'multi_concept', cognitive_level: 'multi_concept', template_prompt: 'Combine VOR radial interpretation with one other IFR concept (e.g. required navigation equipment, or intercepting a radial while holding a specific heading with a known wind) into one scenario.' },
    ],
  },
  {
    slug: 'ifr_alternate_requirements',
    exam_type: 'ifr',
    acs_area: 'IFR Regulations',
    acs_task: 'IR.I.C — Regulations: Alternate Airport and Fuel Requirements',
    category: 'IFR Regulations',
    name: 'IFR Alternate & Fuel Requirements',
    authoritative_source: '14 CFR 91.169, 91.167; AIM 5-1-16',
    rule_summary:
      'Under 14 CFR 91.169, an alternate airport is NOT required if, for at least 1 hour before through 1 hour after the estimated time of arrival, the forecast at the destination shows a ceiling of at least 2,000 ft AGL and visibility of at least 3 SM (the "1-2-3 rule": 1 hour, 2,000 ft, 3 SM). If those conditions are not forecast, an alternate must be filed. ' +
      'If an alternate is required and it has a published standard instrument approach procedure, the standard alternate minimums (unless the approach plate publishes different alternate minimums, which take precedence) are: precision approach — 600 ft ceiling and 2 SM visibility ("600-2"); nonprecision approach — 800 ft ceiling and 2 SM visibility ("800-2"). If the alternate has no published instrument approach, the approach and landing must be possible under basic VFR. ' +
      'Fuel requirement under 91.167: enough fuel to fly to the first airport of intended landing, then (if an alternate is required) to the alternate, then for 45 minutes at normal cruising speed.',
    common_misconceptions:
      'Students frequently forget the 1-hour-before/1-hour-after window when checking the destination forecast, apply the generic 600-2/800-2 minimums even when the approach plate publishes its own (different) alternate minimums that must be used instead, and forget that the 45-minute fuel reserve applies regardless of whether an alternate is required.',
    variables: ['forecast_ceiling', 'forecast_visibility', 'eta_window', 'approach_type', 'published_alternate_minimums'],
    archetypes: [
      { scenario_type: 'application', cognitive_level: 'application', template_prompt: 'Give a destination forecast for the 1-hour-before/1-hour-after ETA window and ask whether an alternate is required.' },
      { scenario_type: 'scenario', cognitive_level: 'scenario', template_prompt: 'Describe an alternate airport\'s published approach and ask which alternate minimums apply (standard 600-2/800-2, a different published minimum, or basic VFR requirements with no approach procedure).' },
      { scenario_type: 'operational_decision', cognitive_level: 'scenario', template_prompt: 'Describe a fuel-planning scenario with and without a required alternate, and ask how much fuel reserve is required at the destination.' },
      { scenario_type: 'interpretation', cognitive_level: 'transfer', template_prompt: 'Describe a pilot\'s (incorrect) alternate-requirement reasoning and ask the student to identify the specific error.' },
    ],
  },
  {
    slug: 'ils_approach_minimums',
    exam_type: 'ifr',
    acs_area: 'Approach Procedures',
    acs_task: 'IR.VII — Instrument Approach Procedures: Precision and Nonprecision',
    category: 'Instrument Approaches',
    name: 'ILS/Approach Minimums & Descent Rate',
    authoritative_source: 'FAA-H-8083-16B, Chapters 4–5 (Approaches); FAA-H-8083-15B, Chapter 9',
    rule_summary:
      'An ILS provides both lateral (localizer) and vertical (glide slope) guidance to a Decision Altitude/Decision Height (DA/DH) — if the required visual references are not in sight at DA, a missed approach must be initiated immediately; level-off or continued descent to "look for the runway" is not permitted. A nonprecision approach (e.g. LOC-only, VOR, or RNAV LNAV) instead uses a Minimum Descent Altitude (MDA), at which level flight IS permitted until reaching the Missed Approach Point (MAP), defined by a fix or elapsed time. Standard 3° glidepath descent rate rule of thumb: descent rate (fpm) ≈ groundspeed (kts) × 5. Circling approach minimums are higher than straight-in minimums because they provide reduced obstacle clearance while maneuvering visually to land on a different runway.',
    common_misconceptions:
      'Students often treat DA like MDA, believing level flight is allowed while looking for the runway (it is not — a missed approach must begin immediately at DA), and they sometimes use true airspeed instead of groundspeed in the glidepath descent-rate rule of thumb, when the rule is specifically based on groundspeed.',
    variables: ['approach_type', 'da_dh', 'mda', 'map', 'groundspeed_kts', 'circling_minimums'],
    archetypes: [
      { scenario_type: 'calculation', cognitive_level: 'application', template_prompt: 'Give a groundspeed on a 3° glidepath approach and ask the student to determine the required descent rate in fpm.' },
      { scenario_type: 'scenario', cognitive_level: 'scenario', template_prompt: 'Describe reaching DA or MDA without the runway environment in sight and ask the student to identify the correct action (immediate missed approach vs. permitted level flight to the MAP).' },
      { scenario_type: 'comparison', cognitive_level: 'scenario', template_prompt: 'Compare a precision approach\'s DA-based minimums to a nonprecision approach\'s MDA-based minimums, or straight-in vs. circling minimums, and ask which applies to a described situation.' },
      { scenario_type: 'interpretation', cognitive_level: 'transfer', template_prompt: 'Ask which single change (a faster groundspeed, a different approach type) would change the correct descent rate or the correct missed-approach decision in a described scenario.' },
    ],
  },
  {
    slug: 'holding_pattern_entry',
    exam_type: 'ifr',
    acs_area: 'Air Traffic Control Clearances and Procedures',
    acs_task: 'IR.VI.B — Navigation Systems: Holding Procedures',
    category: 'IFR En Route',
    name: 'Holding Pattern Entry & Wind Correction',
    authoritative_source: 'FAA-H-8083-15B, Chapter 10 (Holding); AIM 5-3-8',
    rule_summary:
      'A standard holding pattern uses right turns with 1-minute inbound legs below 14,000 ft MSL (1.5-minute legs above). The pattern is divided into three entry sectors based on the aircraft\'s heading when it arrives at the holding fix relative to the inbound holding course: a DIRECT entry (arriving roughly aligned with the holding side) turns directly onto the outbound leg; a TEARDROP entry (arriving from the non-holding side, within about 30° of the outbound reciprocal) flies outbound on a heading about 30° offset from the reciprocal of the inbound course, then turns to intercept the inbound leg; a PARALLEL entry (arriving from the non-holding side, outside the teardrop sector) flies parallel to the inbound course on the non-holding side, then turns back to intercept. Wind correction requires applying roughly triple the wind correction angle on the outbound leg compared to the inbound leg, and adjusting outbound leg timing to compensate for wind so the inbound leg is closer to the standard time.',
    common_misconceptions:
      'Students often confuse which side of the holding course is the "holding side" when distinguishing a teardrop from a parallel entry, and they frequently apply the same (or no) wind correction to both the inbound and outbound legs rather than the roughly tripled outbound correction the procedure calls for.',
    variables: ['inbound_heading', 'holding_course', 'entry_type', 'wind_correction_angle', 'leg_timing'],
    archetypes: [
      { scenario_type: 'application', cognitive_level: 'application', template_prompt: 'Give an aircraft\'s inbound heading to the holding fix and the published holding course, and ask the student to determine the correct entry type (direct, teardrop, or parallel).' },
      { scenario_type: 'scenario', cognitive_level: 'scenario', template_prompt: 'Describe a known wind during holding and ask the student how to adjust the outbound leg heading or timing to compensate.' },
      { scenario_type: 'fault_diagnosis', cognitive_level: 'transfer', template_prompt: 'Describe a pilot who flew the wrong entry type or applied wind correction incorrectly, and ask the student to identify the error.' },
      { scenario_type: 'multi_concept', cognitive_level: 'multi_concept', template_prompt: 'Combine holding entry determination with a specific ATC-issued holding clearance (fix, course, leg length, EFC time) into one scenario.' },
    ],
  },
  {
    slug: 'atc_lost_comm_procedures',
    exam_type: 'ifr',
    acs_area: 'ATC Clearances and Communication',
    acs_task: 'IR.VIII.A — Two-Way Radio Communications Failure',
    category: 'ATC & Communications',
    name: 'Lost Communications Procedures (91.185)',
    authoritative_source: '14 CFR 91.185; AIM 6-4-1',
    rule_summary:
      'Under 14 CFR 91.185: in VFR conditions, continue the flight under VFR and land as soon as practicable. In IFR conditions, ROUTE is flown in this priority order (mnemonic AVEF): Assigned in the last ATC clearance; if none, Vectored, then direct from the point of radio failure to the fix/route specified in the vector clearance; if none, the route ATC has advised may be Expected in a further clearance; if none, the route Filed in the flight plan. ALTITUDE is the HIGHEST of (mnemonic MEA): the altitude assigned in the last clearance; the altitude ATC has advised to Expect; or the Minimum Enroute Altitude for the route segment being flown. LEAVE the clearance limit: if an EFC (expect further clearance) time was received, leave the clearance limit at that EFC time; if no EFC time was received, leave at the ETA calculated from the filed or amended flight plan. Squawk 7600 to indicate radio failure.',
    common_misconceptions:
      'Students often use only the assigned altitude and forget to compare it against the expected altitude and the MEA, taking the highest of all three; they also frequently get the AVEF route order wrong (e.g. defaulting to the filed route when a vectored or expected route should take priority), and confuse the 7600 lost-comm squawk with 7700 (emergency).',
    variables: ['flight_conditions', 'last_clearance', 'expected_clearance', 'mea', 'efc_time', 'filed_route'],
    archetypes: [
      { scenario_type: 'application', cognitive_level: 'application', template_prompt: 'Describe a lost-communications scenario in IFR conditions with an assigned altitude, an expected altitude, and an MEA, and ask which altitude the pilot must fly.' },
      { scenario_type: 'scenario', cognitive_level: 'scenario', template_prompt: 'Describe a lost-communications scenario with an assigned route, a vector in progress, and a filed route, and ask which route the pilot must fly.' },
      { scenario_type: 'operational_decision', cognitive_level: 'scenario', template_prompt: 'Describe a scenario with or without a received EFC time, and ask when the pilot should leave the clearance limit.' },
      { scenario_type: 'interpretation', cognitive_level: 'transfer', template_prompt: 'Describe a pilot\'s (incorrect) lost-comm decision and ask the student to identify which part of 91.185 was applied incorrectly.' },
    ],
  },
  {
    slug: 'instrument_systems_failures',
    exam_type: 'ifr',
    acs_area: 'Aircraft Systems',
    acs_task: 'IR.IX — Aircraft Systems Related to IFR Operations',
    category: 'Instrument Systems',
    name: 'Vacuum & Gyroscopic Instrument Failures',
    authoritative_source: 'FAA-H-8083-15B, Chapter 4 (Flight Instruments)',
    rule_summary:
      'The attitude indicator and heading indicator are typically vacuum-driven (powered by an engine-driven vacuum pump), while the turn coordinator is typically electrically powered — a deliberate design choice so a single vacuum-pump failure does not remove all attitude/turn references at once. A failing vacuum pump commonly causes the attitude indicator to develop slow, sometimes subtle pitch/bank errors before failing outright, rather than failing abruptly and obviously — cross-checking the (electrically powered) turn coordinator against the attitude indicator is the standard way a vacuum failure is caught in flight. Pitot-static instrument failures (airspeed indicator, altimeter, VSI) are independent of the vacuum/electrical gyro split, since they rely on a separate pneumatic system. Partial-panel procedures use the turn coordinator, magnetic compass, altimeter, VSI, and airspeed together to substitute for a lost attitude/heading indicator, since no single one of them is adequate alone.',
    common_misconceptions:
      'Students often assume all gyroscopic instruments would fail together (missing the deliberate vacuum/electric split), trust a slowly failing attitude indicator because it does not fail abruptly, and forget the magnetic compass\'s turning and acceleration errors when relying on it as a partial-panel heading reference.',
    variables: ['failed_instrument', 'power_source', 'cross_check_instrument'],
    archetypes: [
      { scenario_type: 'fault_diagnosis', cognitive_level: 'application', template_prompt: 'Describe a disagreement between the attitude indicator and the turn coordinator and ask the student to identify the likely failure and which instrument to trust.' },
      { scenario_type: 'scenario', cognitive_level: 'scenario', template_prompt: 'Describe a lost attitude/heading indicator scenario and ask which combination of remaining instruments the pilot should use to maintain control.' },
      { scenario_type: 'comparison', cognitive_level: 'scenario', template_prompt: 'Compare vacuum-driven vs. electrically-driven instruments and ask which would be lost together in a described failure (vacuum pump vs. electrical bus).' },
      { scenario_type: 'interpretation', cognitive_level: 'transfer', template_prompt: 'Describe a pilot relying on a single backup instrument and ask the student to identify the risk in that approach.' },
    ],
  },
  {
    slug: 'sid_climb_gradient',
    exam_type: 'ifr',
    acs_area: 'Departure Procedures',
    acs_task: 'IR.IV — Departure Procedures: ODP and SID Compliance',
    category: 'Departure & Arrivals',
    name: 'SID/ODP Climb Gradient',
    authoritative_source: 'FAA-H-8083-16B, Chapter 2 (Departure Procedures); AIM 5-2-8',
    rule_summary:
      'Obstacle Departure Procedures (ODPs) and Standard Instrument Departures (SIDs) may publish a required climb gradient in feet per nautical mile (ft/NM) rather than (or in addition to) a rate of climb in feet per minute. The standard climb gradient assumed to provide obstacle clearance, absent a higher published requirement, is 200 ft/NM. Converting a published ft/NM gradient into a required climb RATE in fpm depends on groundspeed, not true airspeed, because the gradient is a distance-based (not time-based) requirement: required climb rate (fpm) = climb gradient (ft/NM) × groundspeed (kts) ÷ 60. A faster groundspeed requires a HIGHER fpm climb rate to satisfy the same published ft/NM gradient, since the same vertical gain must occur over less time.',
    common_misconceptions:
      'Students often use true airspeed instead of groundspeed when converting a ft/NM gradient to fpm (wind matters, since the gradient is defined per nautical mile of ground track), and they assume a climb rate that satisfies the gradient at one groundspeed automatically satisfies it at a higher groundspeed, when a higher groundspeed actually demands a higher fpm rate.',
    variables: ['climb_gradient_ft_per_nm', 'groundspeed_kts', 'required_climb_rate_fpm'],
    archetypes: [
      { scenario_type: 'calculation', cognitive_level: 'application', template_prompt: 'Give a published climb gradient in ft/NM and a groundspeed, and ask the student to compute the required climb rate in fpm.' },
      { scenario_type: 'scenario', cognitive_level: 'scenario', template_prompt: 'Give a pilot\'s planned climb rate (fpm) at a higher-than-expected groundspeed and ask whether it satisfies a published gradient.' },
      { scenario_type: 'comparison', cognitive_level: 'scenario', template_prompt: 'Compare the standard 200 ft/NM gradient to a higher published gradient at the same groundspeed, and ask which requires the higher fpm climb rate.' },
      { scenario_type: 'interpretation', cognitive_level: 'transfer', template_prompt: 'Ask which single change (faster groundspeed, steeper published gradient) would most increase the required climb rate in a described scenario.' },
    ],
  },
  {
    slug: 'ifr_weather_icing_briefing',
    exam_type: 'ifr',
    acs_area: 'Weather Information',
    acs_task: 'IR.II — Weather Information: Icing and IFR Weather Products',
    category: 'IFR Weather',
    name: 'Structural Icing & IFR Weather Products',
    authoritative_source: 'FAA-H-8083-15B, Chapter 12 (Weather); AIM 7-1-21',
    rule_summary:
      'Clear ice forms from large supercooled water droplets (often freezing rain/drizzle), accumulates quickly, is hard to see and hard to remove, and is generally the most hazardous type. Rime ice forms from small supercooled droplets typically in stratus-type clouds, appears rough/opaque/milky white, and is generally easier to remove than clear ice. Mixed ice combines both. AIRMET Zulu covers moderate icing and freezing levels; AIRMET Sierra covers IFR conditions/mountain obscuration; AIRMET Tango covers turbulence and strong surface winds; a SIGMET covers more severe conditions (including severe icing) and applies to all aircraft, not just smaller ones. PIREPs (pilot reports) are the best real-time confirmation of actual icing encountered, since forecasts describe probable conditions while a PIREP reports what was actually observed.',
    common_misconceptions:
      'Students often assume rime ice is always less hazardous than clear ice regardless of accumulation rate and coverage, confuse which AIRMET letter covers which hazard (Sierra/Tango/Zulu), and treat a forecast product as more authoritative than a PIREP, when a PIREP is an actual observation rather than a prediction.',
    variables: ['icing_type', 'airmet_type', 'sigmet', 'pirep', 'freezing_level'],
    archetypes: [
      { scenario_type: 'interpretation', cognitive_level: 'application', template_prompt: 'Describe icing conditions encountered (droplet size, cloud type, accumulation rate) and ask the student to identify the icing type.' },
      { scenario_type: 'application', cognitive_level: 'application', template_prompt: 'Give an AIRMET or SIGMET excerpt and ask what hazard it describes or which letter/type covers a described hazard.' },
      { scenario_type: 'scenario', cognitive_level: 'scenario', template_prompt: 'Describe a route-planning scenario needing to avoid icing, using freezing-level and cloud-top information, and ask for the best course of action.' },
      { scenario_type: 'comparison', cognitive_level: 'scenario', template_prompt: 'Compare a forecast product (AIRMET/SIGMET/TAF) to a recent PIREP describing different conditions, and ask which the pilot should weight more heavily and why.' },
    ],
  },
  {
    slug: 'ifr_emergency_partial_panel',
    exam_type: 'ifr',
    acs_area: 'Emergency Operations',
    acs_task: 'IR.X — Emergency Operations: Instrument and System Failures',
    category: 'IFR Emergency Operations',
    name: 'IFR Emergencies & Partial-Panel Flying',
    authoritative_source: '14 CFR 91.3(b); FAA-H-8083-15B, Chapter 17 (Emergency Operations)',
    rule_summary:
      '14 CFR 91.3(b) authorizes the pilot in command, in an in-flight emergency requiring immediate action, to deviate from any rule of Part 91 to the extent required to meet that emergency — ATC should be notified as soon as practicable, not necessarily before deviating. When primary attitude/heading references are lost, partial-panel technique relies on the turn coordinator, magnetic compass, altimeter, VSI, and airspeed indicator used TOGETHER, since no single one of them is adequate alone (each has its own limitation: compass turning/acceleration errors, VSI lag, turn coordinator shows rate rather than attitude). An engine failure or other emergency under IFR should be handled with standard emergency procedures (best glide, checklist) while notifying ATC and, if not already in radar contact or receiving services, squawking 7700.',
    common_misconceptions:
      'Students often believe ATC must be notified BEFORE taking emergency action rather than as soon as practicable afterward, rely on a single partial-panel instrument instead of cross-checking several together, and forget that 91.3(b) authority extends to deviating from ATC clearances and Part 91 rules alike when genuinely required by the emergency.',
    variables: ['emergency_type', 'lost_instruments', 'atc_notification_timing', 'transponder_code'],
    archetypes: [
      { scenario_type: 'scenario', cognitive_level: 'scenario', template_prompt: 'Describe an in-flight emergency under IFR (engine failure, instrument loss) and ask the student to sequence the correct priorities (aircraft control, then navigation, then communication).' },
      { scenario_type: 'application', cognitive_level: 'application', template_prompt: 'Describe a lost attitude/heading indicator scenario and ask which combination of instruments the pilot should cross-check to maintain control.' },
      { scenario_type: 'operational_decision', cognitive_level: 'scenario', template_prompt: 'Describe a scenario where following an ATC clearance would conflict with handling an emergency, and ask what authority the pilot has and when to notify ATC.' },
      { scenario_type: 'interpretation', cognitive_level: 'transfer', template_prompt: 'Describe a pilot\'s (incorrect) emergency decision (e.g. waiting for ATC permission before deviating) and ask the student to identify the error.' },
    ],
  },
]

async function seed() {
  for (const concept of CONCEPTS) {
    const { archetypes, ...conceptRow } = concept

    const { data: existing } = await supabase.from('concepts').select('id').eq('slug', concept.slug).maybeSingle()

    let conceptId
    if (existing) {
      const { data: updated, error } = await supabase
        .from('concepts')
        .update(conceptRow)
        .eq('id', existing.id)
        .select('id')
        .single()
      if (error) throw new Error(`Failed to update concept ${concept.slug}: ${error.message}`)
      conceptId = updated.id
      console.log(`Updated concept: ${concept.name} (${conceptId})`)
    } else {
      const { data: inserted, error } = await supabase.from('concepts').insert(conceptRow).select('id').single()
      if (error) throw new Error(`Failed to insert concept ${concept.slug}: ${error.message}`)
      conceptId = inserted.id
      console.log(`Inserted concept: ${concept.name} (${conceptId})`)
    }

    const { data: existingArchetypes } = await supabase
      .from('question_archetypes')
      .select('id, scenario_type')
      .eq('concept_id', conceptId)
    const existingScenarioTypes = new Set((existingArchetypes || []).map(a => a.scenario_type))

    const newArchetypes = archetypes
      .filter(a => !existingScenarioTypes.has(a.scenario_type))
      .map(a => ({ ...a, concept_id: conceptId }))

    if (newArchetypes.length > 0) {
      const { error } = await supabase.from('question_archetypes').insert(newArchetypes)
      if (error) throw new Error(`Failed to insert archetypes for ${concept.slug}: ${error.message}`)
      console.log(`  + ${newArchetypes.length} archetype(s)`)
    } else {
      console.log(`  archetypes already up to date`)
    }
  }

  console.log('\nDone. Concepts are seeded — generateValidatedQuestion() can now run for: ' + CONCEPTS.map(c => c.slug).join(', '))
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
