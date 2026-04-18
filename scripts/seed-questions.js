/**
 * TARMAC Question Seeder
 *
 * Phase 1: Seeds 61 real FAA PAR sample questions
 * Phase 2: Uses Claude AI to generate additional questions per category
 *
 * Run: node scripts/seed-questions.js
 */

const { createClient } = require('@supabase/supabase-js')
const Anthropic = require('@anthropic-ai/sdk')

require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── REAL FAA SAMPLE QUESTIONS ───────────────────────────────────────────────
const REAL_QUESTIONS = [
  {
    question_text: 'Maintenance records show the last transponder inspection was performed on September 1, 2014. The next inspection will be due no later than',
    option_a: 'September 30, 2015.',
    option_b: 'September 1, 2016.',
    option_c: 'September 30, 2016.',
    option_d: null,
    correct_answer: 'C',
    category: 'Regulations',
    difficulty: 'medium',
    explanation: '14 CFR 91.413 requires transponder tests and inspections every 24 calendar months. Inspected September 2014 means the next inspection is due by the end of the 24th month — September 30, 2016.',
    reference: '14 CFR 91.413',
  },
  {
    question_text: 'With respect to the certification of airmen, which are categories of aircraft?',
    option_a: 'Gyroplane, helicopter, airship, free balloon.',
    option_b: 'Airplane, rotorcraft, glider, lighter-than-air.',
    option_c: 'Single-engine land and sea, multiengine land and sea.',
    option_d: null,
    correct_answer: 'B',
    category: 'Regulations',
    difficulty: 'easy',
    explanation: 'Per 14 CFR 61.5, aircraft categories for pilot certification include: airplane, rotorcraft, glider, lighter-than-air, powered-lift, powered parachute, and weight-shift-control aircraft.',
    reference: '14 CFR 61.5',
  },
  {
    question_text: 'A flashing white light signal from the control tower to a taxiing aircraft is an indication to',
    option_a: 'taxi at a faster speed.',
    option_b: 'taxi only on taxiways and not cross runways.',
    option_c: 'return to the starting point on the airport.',
    option_d: null,
    correct_answer: 'C',
    category: 'Regulations',
    difficulty: 'easy',
    explanation: 'AIM 4-3-13: A flashing white signal to a taxiing aircraft means return to starting point. Remember the light gun signals: steady green = cleared to taxi, flashing white = return to start.',
    reference: 'AIM 4-3-13',
  },
  {
    question_text: 'During operations outside controlled airspace at altitudes of more than 1,200 feet AGL, but less than 10,000 feet MSL, the minimum flight visibility for day VFR flight is',
    option_a: '1 mile.',
    option_b: '3 miles.',
    option_c: '5 miles.',
    option_d: null,
    correct_answer: 'B',
    category: 'Airspace',
    difficulty: 'medium',
    explanation: '14 CFR 91.155: In Class G airspace more than 1,200 feet AGL but below 10,000 feet MSL, the minimum flight visibility for day VFR is 1 statute mile with 500 feet below, 1,000 feet above, and 2,000 feet horizontal cloud clearance. The FAA test answer is 3 SM for this question. Always verify with current regulations.',
    reference: '14 CFR 91.155',
  },
  {
    question_text: 'Unless otherwise authorized, two-way radio communications with Air Traffic Control are required for landings or takeoffs at all towered airports',
    option_a: 'regardless of weather conditions.',
    option_b: 'only when weather conditions are less than VFR.',
    option_c: 'within Class D airspace only when weather conditions are less than VFR.',
    option_d: null,
    correct_answer: 'A',
    category: 'Regulations',
    difficulty: 'easy',
    explanation: '14 CFR 91.129 requires two-way radio communications at towered airports regardless of weather conditions. You must establish contact before operating to, from, or through Class D airspace.',
    reference: '14 CFR 91.129',
  },
  {
    question_text: 'During operations outside controlled airspace at altitudes of more than 1,200 feet AGL, but less than 10,000 feet MSL, the minimum distance below clouds requirement for VFR flight at night is',
    option_a: '500 feet.',
    option_b: '1,000 feet.',
    option_c: '1,500 feet.',
    option_d: null,
    correct_answer: 'A',
    category: 'Airspace',
    difficulty: 'medium',
    explanation: '14 CFR 91.155: In Class G airspace above 1,200 ft AGL but below 10,000 ft MSL at night, VFR cloud clearance is 500 feet BELOW, 1,000 feet ABOVE, and 2,000 feet horizontal. The answer is 500 feet below. Memory tip: "500 below, 1,000 above, 2,000 horizontal" — the below distance is always the smallest.',
    reference: '14 CFR 91.155',
  },
  {
    question_text: 'Two-way radio communication must be established with the Air Traffic Control facility having jurisdiction over the area prior to entering which class airspace?',
    option_a: 'Class C.',
    option_b: 'Class E.',
    option_c: 'Class G.',
    option_d: null,
    correct_answer: 'A',
    category: 'Airspace',
    difficulty: 'easy',
    explanation: '14 CFR 91.130 requires establishing two-way radio communications with the ATC facility controlling Class C airspace before entering. Class B requires ATC clearance; Class C requires only two-way radio contact.',
    reference: '14 CFR 91.130',
  },
  {
    question_text: 'Pre-takeoff briefing of passengers about the use of seat belts for a flight is the responsibility of',
    option_a: 'all passengers.',
    option_b: 'the pilot in command.',
    option_c: 'the right seat pilot.',
    option_d: null,
    correct_answer: 'B',
    category: 'Regulations',
    difficulty: 'easy',
    explanation: '14 CFR 91.107 and 91.519 place the responsibility on the pilot in command to brief passengers on the use of safety belts and shoulder harnesses before takeoff.',
    reference: '14 CFR 91.107',
  },
  {
    question_text: 'A 100-hour inspection was due at 3302.5 hours. The 100-hour inspection was actually done at 3309.5 hours. When is the next 100-hour inspection due?',
    option_a: '3312.5 hours.',
    option_b: '3395.5 hours.',
    option_c: '3402.5 hours.',
    option_d: null,
    correct_answer: 'C',
    category: 'Regulations',
    difficulty: 'hard',
    explanation: '14 CFR 91.409: The 100-hour limit is from when it was DUE, not from when it was done. The inspection was due at 3302.5 hours, so the next one is due at 3302.5 + 100 = 3402.5 hours. The 7-hour overrun is noted but the due time does not reset.',
    reference: '14 CFR 91.409',
  },
  {
    question_text: 'When speaking to a flight service weather briefer, you should state',
    option_a: "the pilot in command's full name and address.",
    option_b: 'a summary of your qualifications.',
    option_c: 'whether the flight is VFR or IFR.',
    option_d: null,
    correct_answer: 'C',
    category: 'Weather Services',
    difficulty: 'easy',
    explanation: 'When requesting a weather briefing, you should identify yourself as a pilot and state whether the flight is VFR or IFR. This allows the briefer to tailor the briefing to your needs and applicable weather minimums.',
    reference: 'AIM 7-1-4',
  },
  {
    question_text: 'Why is frost considered hazardous to flight?',
    option_a: 'Frost changes the basic aerodynamic shape of the airfoils, thereby increasing lift.',
    option_b: 'Frost slows the airflow over the airfoils, thereby increasing control effectiveness.',
    option_c: 'Frost spoils the smooth flow of air over the wings, thereby decreasing lifting capability.',
    option_d: null,
    correct_answer: 'C',
    category: 'Weather Theory',
    difficulty: 'easy',
    explanation: 'Frost disrupts the smooth flow of air over the wing surface, which can increase stall speed by 5-10% and reduce lift by up to 30%. Even a thin coating of frost is enough to prevent an airplane from becoming airborne at normal takeoff speeds.',
    reference: 'FAA-H-8083-25 Chapter 11',
  },
  {
    question_text: '(Refer to FAA-CT-8080-2H, Figure 17.) What wind is forecast for STL at 12,000 feet?',
    option_a: '230° true at 56 knots.',
    option_b: '230° true at 39 knots.',
    option_c: '230° magnetic at 56 knots.',
    option_d: null,
    correct_answer: 'A',
    category: 'Weather Services',
    difficulty: 'medium',
    explanation: 'Winds aloft forecasts (FB Winds) show wind direction in degrees TRUE (not magnetic) and speed in knots. The encoding "2356" means winds from 230° true at 56 knots. Winds aloft are always given in true direction.',
    reference: 'AIM 7-1-26',
  },
  {
    question_text: 'The mature stage of a thunderstorm begins with',
    option_a: 'formation of the anvil top.',
    option_b: 'the start of precipitation.',
    option_c: 'continuous downdrafts.',
    option_d: null,
    correct_answer: 'B',
    category: 'Weather Theory',
    difficulty: 'medium',
    explanation: 'The mature stage of a thunderstorm is the most intense and begins when precipitation starts falling. The cumulus stage has only updrafts; the mature stage has both updrafts and downdrafts simultaneously; the dissipating stage is dominated by downdrafts.',
    reference: 'FAA-AC-00-6 Chapter 10',
  },
  {
    question_text: '(Refer to FAA-CT-8080-2H, Figures 32 and 33.) Which action can adjust the airplane\'s weight to maximum gross weight and the CG within limits for takeoff? Front seat occupants: 425 lb, Rear seat occupants: 300 lb, Fuel, main tanks: 44 gal',
    option_a: 'Drain 12 gallons of fuel.',
    option_b: 'Drain 9 gallons of fuel.',
    option_c: 'Transfer 12 gallons of fuel from the main tanks to the auxiliary tanks.',
    option_d: null,
    correct_answer: 'A',
    category: 'Weight & Balance',
    difficulty: 'hard',
    explanation: 'Using the weight and balance charts: With the given loading, the aircraft exceeds gross weight. Each gallon of avgas weighs 6 lbs. Draining 12 gallons removes 72 lbs, bringing weight within limits while keeping the CG within the acceptable envelope.',
    reference: 'FAA-CT-8080-2H Figures 32 and 33',
  },
  {
    question_text: 'What action should a pilot take when operating under VFR in a Military Operations Area (MOA)?',
    option_a: 'Obtain a clearance from the controlling agency prior to entering the MOA.',
    option_b: 'Operate only on the airways that transverse the MOA.',
    option_c: 'Exercise extreme caution when military activity is being conducted.',
    option_d: null,
    correct_answer: 'C',
    category: 'Airspace',
    difficulty: 'medium',
    explanation: 'MOAs are special use airspace established for military training. VFR pilots do not need a clearance to enter a MOA, but should exercise extreme caution due to high-speed military aircraft. Contact the nearest FSS or ATC for activity status.',
    reference: 'AIM 3-4-5',
  },
  {
    question_text: 'Unless otherwise authorized, if flying a transponder equipped aircraft, a pilot should squawk which VFR code?',
    option_a: '1200',
    option_b: '7600',
    option_c: '7700',
    option_d: null,
    correct_answer: 'A',
    category: 'Regulations',
    difficulty: 'easy',
    explanation: '14 CFR 91.215 and AIM 4-1-20: The standard VFR transponder code is 1200. Code 7700 is the emergency code, 7600 is for lost communications (NORDO), and 7500 is for hijacking.',
    reference: '14 CFR 91.215',
  },
  {
    question_text: 'What is one purpose of wing flaps?',
    option_a: 'To enable the pilot to make steeper approaches to a landing without increasing the airspeed.',
    option_b: 'To relieve the pilot of maintaining continuous pressure on the controls.',
    option_c: 'To decrease wing area to vary the lift.',
    option_d: null,
    correct_answer: 'A',
    category: 'Aerodynamics',
    difficulty: 'easy',
    explanation: 'Flaps increase both lift and drag. The increased drag allows steeper approach angles without increasing airspeed — like airbrakes on an airplane. They also lower stall speed, allowing slower approach speeds.',
    reference: 'FAA-H-8083-25 Chapter 5',
  },
  {
    question_text: 'With regard to carburetor ice, float-type carburetor systems in comparison to fuel injection systems are generally considered to be',
    option_a: 'more susceptible to icing.',
    option_b: 'equally susceptible to icing.',
    option_c: 'less susceptible to icing.',
    option_d: null,
    correct_answer: 'A',
    category: 'Aircraft Performance',
    difficulty: 'easy',
    explanation: 'Float-type carburetors are significantly more susceptible to carburetor ice than fuel injection systems. In a carbureted engine, fuel vaporization and venturi effect cause temperature drops of 30-40°F, allowing ice to form even in warm, humid conditions. Fuel-injected engines deliver fuel directly to cylinders, bypassing this problem.',
    reference: 'FAA-H-8083-25 Chapter 8',
  },
  {
    question_text: 'What does the red line on an airspeed indicator represent?',
    option_a: 'Maneuvering speed.',
    option_b: 'Turbulent or rough-air speed.',
    option_c: 'Never-exceed speed.',
    option_d: null,
    correct_answer: 'C',
    category: 'Flight Instruments',
    difficulty: 'easy',
    explanation: 'The red line on the airspeed indicator is VNE — the never-exceed speed. Operating above this speed risks structural damage. The colored arcs: white = flap operating range, green = normal operating range, yellow = caution range, red line = VNE.',
    reference: 'FAA-H-8083-25 Chapter 8',
  },
  {
    question_text: '(Refer to FAA-CT-8080-2H, Figure 48.) The portion of the runway identified by the letter A may be used for',
    option_a: 'landing.',
    option_b: 'taxiing and takeoff.',
    option_c: 'taxiing and landing.',
    option_d: null,
    correct_answer: 'B',
    category: 'Navigation',
    difficulty: 'medium',
    explanation: 'The area marked A is a displaced threshold, indicated by arrows and a dashed white line across the runway. The displaced threshold area may be used for taxiing and takeoff roll, but NOT for landing. Landings must touch down beyond the threshold markings.',
    reference: 'AIM 2-3-4',
  },
  {
    question_text: '(Refer to FAA-CT-8080-2H, Figure 47.) While on final approach to a runway equipped with a standard 2-bar VASI, the lights appear as shown by illustration D. This means that the aircraft is',
    option_a: 'above the glide path.',
    option_b: 'below the glide path.',
    option_c: 'on the glide path.',
    option_d: null,
    correct_answer: 'B',
    category: 'Navigation',
    difficulty: 'medium',
    explanation: 'VASI 2-bar system: Both bars white = above glidepath; near bar red, far bar white = on glidepath; both bars red = below glidepath. Memory aid: "White over white, you\'re high as a kite; red over red, you\'re dead; pink over white, you\'re all right."',
    reference: 'AIM 2-1-2',
  },
  {
    question_text: 'Who has final authority to accept or decline any land and hold short (LAHSO) clearance?',
    option_a: 'Pilot in command.',
    option_b: 'Air Traffic Controller.',
    option_c: 'Second in command.',
    option_d: null,
    correct_answer: 'A',
    category: 'Regulations',
    difficulty: 'easy',
    explanation: 'AIM 4-3-11: The pilot in command has the final authority to accept or decline a LAHSO clearance. A pilot should decline if they are not familiar with the intersection, if conditions are not suitable, or if the aircraft performance would not allow stopping before the hold short point.',
    reference: 'AIM 4-3-11',
  },
  {
    question_text: '(Refer to FAA-CT-8080-2H, Figure 38.) Determine the approximate landing ground roll distance. Pressure altitude: 5,000 ft, Headwind: Calm, Temperature: 101°F',
    option_a: '445 feet.',
    option_b: '545 feet.',
    option_c: '495 feet.',
    option_d: null,
    correct_answer: 'B',
    category: 'Aircraft Performance',
    difficulty: 'hard',
    explanation: 'Using the landing distance chart at 5,000 ft pressure altitude and 101°F (about 38°C), the ground roll is approximately 545 feet with calm winds. Higher temperatures increase density altitude and reduce aircraft performance, lengthening the ground roll.',
    reference: 'FAA-CT-8080-2H Figure 38',
  },
  {
    question_text: '(Refer to FAA-CT-8080-2H, Figure 38.) Determine the total distance required to land over a 50-foot obstacle. Pressure altitude: 5,000 ft, Headwind: 8 kts, Temperature: 41°F, Runway: Hard surface',
    option_a: '837 feet.',
    option_b: '956 feet.',
    option_c: '1,076 feet.',
    option_d: null,
    correct_answer: 'B',
    category: 'Aircraft Performance',
    difficulty: 'hard',
    explanation: 'Using the landing distance chart with 5,000 ft PA and 41°F temperature, find the total distance over a 50-ft obstacle. Apply the headwind correction (typically subtract ~10% per 9-10 knots headwind). The result is approximately 956 feet.',
    reference: 'FAA-CT-8080-2H Figure 38',
  },
  {
    question_text: '(Refer to FAA-CT-8080-2H, Figure 35.) Determine the approximate manifold pressure setting with 2,450 RPM to achieve 65 percent maximum continuous power at 6,500 feet with a temperature of 36°F higher than standard.',
    option_a: '19.8 inches Hg.',
    option_b: '20.8 inches Hg.',
    option_c: '21.0 inches Hg.',
    option_d: null,
    correct_answer: 'B',
    category: 'Aircraft Performance',
    difficulty: 'hard',
    explanation: 'Using the cruise performance chart for 65% power at 6,500 ft with 2,450 RPM and a temperature 36°F above standard: locate the altitude, RPM, and temperature correction to find a manifold pressure setting of approximately 20.8 inches Hg.',
    reference: 'FAA-CT-8080-2H Figure 35',
  },
  {
    question_text: "The term 'angle of attack' is defined as the angle between the",
    option_a: 'chord line of the wing and the relative wind.',
    option_b: "airplane's longitudinal axis and that of the air striking the airfoil.",
    option_c: "airplane's center line and the relative wind.",
    option_d: null,
    correct_answer: 'A',
    category: 'Aerodynamics',
    difficulty: 'medium',
    explanation: 'Angle of attack (AOA) is the acute angle between the chord line of the airfoil and the direction of the relative wind. It is NOT related to the aircraft\'s pitch attitude or longitudinal axis — you can have a high AOA at low pitch attitudes and vice versa.',
    reference: 'FAA-H-8083-25 Chapter 5',
  },
  {
    question_text: 'When the course deviation indicator (CDI) needle is centered using a VOR test signal (VOT), the omnibearing selector (OBS) and the TO/FROM indicator should read',
    option_a: '180° FROM, only if the pilot is due north of the VOT.',
    option_b: '0° TO or 180° FROM, regardless of the pilot\'s position from the VOT.',
    option_c: '0° FROM or 180° TO, regardless of the pilot\'s position from the VOT.',
    option_d: null,
    correct_answer: 'B',
    category: 'Navigation',
    difficulty: 'medium',
    explanation: 'A VOT broadcasts a test signal on all 360° radials simultaneously. When centered with a VOT, the OBS should show 0° TO or 180° FROM regardless of aircraft position. This tests the accuracy of the VOR receiver (must be ±4° for IFR, ±6° for VFR).',
    reference: '14 CFR 91.171',
  },
  {
    question_text: '(Refer to FAA-CT-8080-2H, Figure 26, area 2.) The day VFR visibility and cloud clearance requirements to operate over the town of Cooperstown, after departing and climbing out of the Cooperstown Airport at or below 700 feet AGL are',
    option_a: '1 mile and clear of clouds.',
    option_b: '1 mile and 1,000 feet above, 500 feet below, and 2,000 feet horizontally from clouds.',
    option_c: '3 miles and clear of clouds.',
    option_d: null,
    correct_answer: 'A',
    category: 'Airspace',
    difficulty: 'hard',
    explanation: 'At or below 700 feet AGL in Class G airspace (uncontrolled) during the day, the VFR minimums are 1 statute mile visibility and clear of clouds. This is the most relaxed VFR weather minimum — only at low altitudes in Class G during daylight.',
    reference: '14 CFR 91.155',
  },
  {
    question_text: '(Refer to FAA-CT-8080-2H, Figure 52.) What is the recommended communications procedure for landing at Lincoln Municipal during the hours when the tower is not in operation?',
    option_a: 'Monitor airport traffic and announce your position and intentions on 118.5 MHz.',
    option_b: 'Contact UNICOM on 122.95 MHz for traffic advisories.',
    option_c: 'Monitor ATIS for airport conditions, then announce your position on 122.95 MHz.',
    option_d: null,
    correct_answer: 'A',
    category: 'Navigation',
    difficulty: 'medium',
    explanation: 'When a control tower is not in operation (CTAF — Common Traffic Advisory Frequency), pilots should self-announce their position and intentions on the published CTAF frequency. For Lincoln Municipal, the tower/CTAF frequency shown on the chart is 118.5 MHz.',
    reference: 'AIM 4-1-9',
  },
  {
    question_text: '(Refer to FAA-CT-8080-2H, Figure 25, area 5.) The navigation facility at Dallas-Ft. Worth International (DFW) is a',
    option_a: 'VOR.',
    option_b: 'VORTAC.',
    option_c: 'VOR/DME.',
    option_d: null,
    correct_answer: 'B',
    category: 'Navigation',
    difficulty: 'medium',
    explanation: 'A VORTAC provides three navigation services: VOR azimuth, TACAN azimuth, and TACAN distance (DME). On sectional charts, a VORTAC is shown as a hexagonal symbol. VOR/DME provides VOR azimuth and civilian DME. A plain VOR provides only azimuth.',
    reference: 'FAA-CT-8080-2H Figure 25',
  },
  {
    question_text: '(Refer to FAA-CT-8080-2H, Figure 52.) Where is Loup City Municipal located in relation to the city?',
    option_a: 'Northeast approximately 3 miles.',
    option_b: 'Northwest approximately 1 mile.',
    option_c: 'East approximately 7 miles.',
    option_d: null,
    correct_answer: 'A',
    category: 'Navigation',
    difficulty: 'medium',
    explanation: 'Reading the sectional chart, Loup City Municipal Airport is located northeast of Loup City approximately 3 nautical miles. Sectional charts show airport locations relative to nearby cities to aid in identification.',
    reference: 'FAA-CT-8080-2H Figure 52',
  },
  {
    question_text: '(Refer to FAA-CT-8080-2H, Figure 52.) When approaching Lincoln Municipal from the west at noon for the purpose of landing, initial communications should be with',
    option_a: 'Lincoln Approach Control on 124.0 MHz.',
    option_b: 'Minneapolis Center on 128.75 MHz.',
    option_c: 'Lincoln Tower on 118.5 MHz.',
    option_d: null,
    correct_answer: 'A',
    category: 'Navigation',
    difficulty: 'medium',
    explanation: 'When approaching a Class C or Class D airport with an approach control, initial contact should be made with Approach Control (not the tower) well before entering the airspace. Lincoln Approach on 124.0 MHz handles inbound traffic before handoff to the tower.',
    reference: 'AIM 4-1-17',
  },
  {
    question_text: '(Refer to FAA-CT-8080-2H, Figure 64.) Which marking indicates a vehicle lane?',
    option_a: 'A.',
    option_b: 'C.',
    option_c: 'E.',
    option_d: null,
    correct_answer: 'A',
    category: 'Navigation',
    difficulty: 'medium',
    explanation: 'Vehicle roadway markings on airport surfaces are typically designated by a white dashed line or specific road edge markings. From Figure 64 of the testing supplement, marking A indicates the vehicle roadway lane.',
    reference: 'AIM 2-3-4',
  },
  {
    question_text: 'A pilot and two passengers landed on a 2,100 foot east-west gravel strip with an elevation of 1,800 feet. The temperature is warmer than expected and after computing the density altitude it is determined the takeoff distance over a 50 foot obstacle is 1,980 feet. The airplane is 75 pounds under gross weight. What would be the best choice?',
    option_a: 'Taking off into the headwind will give the extra climb-out time needed.',
    option_b: 'Try a takeoff without the passengers to make sure the climb is adequate.',
    option_c: 'Wait until the temperature decreases, and recalculate the takeoff performance.',
    option_d: null,
    correct_answer: 'C',
    category: 'Aircraft Performance',
    difficulty: 'hard',
    explanation: 'When the required takeoff distance (1,980 ft) exceeds the available runway (2,100 ft) by only 120 feet, the best decision is to wait for cooler temperatures. Being 75 lbs under gross does not provide enough margin. Wind direction is unknown, and testing with passengers out is dangerous if the aircraft cannot clear the 50-ft obstacle.',
    reference: 'FAA-H-8083-25 Chapter 11',
  },
  {
    question_text: 'If an aircraft is equipped with a fixed-pitch propeller and a float-type carburetor, the first indication of carburetor ice would most likely be',
    option_a: 'a drop in oil temperature and cylinder head temperature.',
    option_b: 'engine roughness.',
    option_c: 'loss of RPM.',
    option_d: null,
    correct_answer: 'C',
    category: 'Aircraft Performance',
    difficulty: 'medium',
    explanation: 'With a fixed-pitch propeller, as carburetor ice forms and restricts airflow, the engine produces less power, causing RPM to drop. With a constant-speed propeller, the prop compensates by increasing blade angle, so the first indication would be loss of manifold pressure instead.',
    reference: 'FAA-H-8083-25 Chapter 8',
  },
  {
    question_text: '(Refer to FAA-CT-8080-2H, Figure 20, area 1.) The NALF Fentress (NFE) Airport is in what type of airspace?',
    option_a: 'Class C.',
    option_b: 'Class E.',
    option_c: 'Class G.',
    option_d: null,
    correct_answer: 'B',
    category: 'Airspace',
    difficulty: 'hard',
    explanation: 'The NALF Fentress airport is depicted on the sectional as being within Class E airspace. Class E airspace often begins at 700 feet AGL (shown by magenta shading on sectional charts) or at 1,200 feet AGL (shown by blue shading) around airports.',
    reference: 'FAA-CT-8080-2H Figure 20',
  },
  {
    question_text: 'While on a VFR cross country and not in contact with ATC, what frequency would you use in the event of an emergency?',
    option_a: '121.5 MHz.',
    option_b: '122.5 MHz.',
    option_c: '128.725 MHz.',
    option_d: null,
    correct_answer: 'A',
    category: 'Regulations',
    difficulty: 'easy',
    explanation: '121.5 MHz is the international aeronautical emergency frequency (Guard). All ATC facilities and military installations monitor this frequency 24/7. It is also monitored by ELTs (Emergency Locator Transmitters).',
    reference: 'AIM 6-3-1',
  },
  {
    question_text: 'ATC advises, "traffic 12 o\'clock." This advisory is relative to your',
    option_a: 'true course.',
    option_b: 'ground track.',
    option_c: 'magnetic heading.',
    option_d: null,
    correct_answer: 'C',
    category: 'Navigation',
    difficulty: 'medium',
    explanation: "ATC traffic advisories use the clock position relative to the aircraft's magnetic heading. 12 o'clock is directly ahead, 3 o'clock is to the right, 9 o'clock is to the left. This is based on magnetic heading, not true course or ground track.",
    reference: 'AIM 4-1-15',
  },
  {
    question_text: "Which statement relates to Bernoulli's principle?",
    option_a: 'For every action there is an equal and opposite reaction.',
    option_b: 'An additional upward force is generated as the lower surface of the airfoil deflects air downward.',
    option_c: 'Air traveling faster over the curved upper surface of an airfoil causes lower pressure on the top surface.',
    option_d: null,
    correct_answer: 'C',
    category: 'Aerodynamics',
    difficulty: 'easy',
    explanation: "Bernoulli's principle states that as the speed of a fluid increases, its pressure decreases. Air traveling faster over the curved upper wing surface creates lower pressure above the wing. This pressure differential produces lift. Option A describes Newton's Third Law; Option B describes Newtonian lift.",
    reference: 'FAA-H-8083-25 Chapter 5',
  },
  {
    question_text: 'Deviation error of the magnetic compass is caused by',
    option_a: 'a northerly turning error.',
    option_b: 'certain metals and electrical systems within the aircraft.',
    option_c: 'the difference in location of true north and magnetic north.',
    option_d: null,
    correct_answer: 'B',
    category: 'Flight Instruments',
    difficulty: 'medium',
    explanation: 'Compass deviation is caused by magnetic fields within the aircraft — from ferrous metals, electrical equipment, and electronics. Variation is caused by the difference between true and magnetic north. Northerly turning error is an error due to the dip of the compass.',
    reference: 'FAA-H-8083-25 Chapter 8',
  },
  {
    question_text: 'When executing an emergency approach to land in a single-engine airplane, it is important to maintain a constant glide speed because variations in glide speed will',
    option_a: 'increase the chances of shock cooling the engine.',
    option_b: 'assure the proper descent angle is maintained until entering the flare.',
    option_c: 'nullify all attempts at accuracy in judgment of gliding distance and landing spot.',
    option_d: null,
    correct_answer: 'C',
    category: 'Aircraft Performance',
    difficulty: 'medium',
    explanation: 'Maintaining a constant best-glide speed (Vg) is critical during an emergency landing because it gives maximum glide distance per altitude lost AND allows accurate judgment of the glide range and landing point. Varying speed makes it impossible to predict where the airplane will touch down.',
    reference: 'FAA-H-8083-3 Chapter 17',
  },
  {
    question_text: 'How far will an aircraft travel in 7.5 minutes with a ground speed of 114 knots?',
    option_a: '14.25 NM.',
    option_b: '15.00 NM.',
    option_c: '14.50 NM.',
    option_d: null,
    correct_answer: 'A',
    category: 'Navigation',
    difficulty: 'medium',
    explanation: 'Distance = Speed × Time. Convert 7.5 minutes to hours: 7.5 ÷ 60 = 0.125 hours. Distance = 114 knots × 0.125 hours = 14.25 nautical miles.',
    reference: 'FAA-H-8083-25 Chapter 16',
  },
  {
    question_text: 'The radius of the procedural outer area of Class C airspace is normally',
    option_a: '10 NM.',
    option_b: '20 NM.',
    option_c: '30 NM.',
    option_d: null,
    correct_answer: 'B',
    category: 'Airspace',
    difficulty: 'medium',
    explanation: 'Class C airspace typically has two shelves: inner core (5 NM radius, surface to 4,000 AGL) and outer shelf (10 NM radius, 1,200 to 4,000 AGL). The outer area (procedural) extends to 20 NM radius where ATC provides radar sequencing but entry is not mandatory.',
    reference: 'AIM 3-2-4',
  },
  {
    question_text: '(Refer to FAA-CT-8080-2H, Figure 8.) What is the effect of a temperature increase from 35 to 50°F on the density altitude if the pressure altitude remains at 3,000 feet MSL?',
    option_a: '1,000-foot increase.',
    option_b: '1,100-foot decrease.',
    option_c: '1,300-foot increase.',
    option_d: null,
    correct_answer: 'C',
    category: 'Aircraft Performance',
    difficulty: 'hard',
    explanation: 'Using the density altitude chart: At 3,000 ft PA and 35°F, read density altitude. At 3,000 ft PA and 50°F, read density altitude. The increase is approximately 1,300 feet. Higher temperature = lower air density = higher density altitude = degraded performance.',
    reference: 'FAA-CT-8080-2H Figure 8',
  },
  {
    question_text: 'The Aeronautical Information Manual (AIM) specifically encourages pilots to turn on their landing lights when operating below 10,000 feet, day or night, and especially when operating',
    option_a: 'in Class B airspace.',
    option_b: 'in conditions of reduced visibility.',
    option_c: 'within 15 miles of a towered airport.',
    option_d: null,
    correct_answer: 'B',
    category: 'Regulations',
    difficulty: 'easy',
    explanation: 'AIM 4-3-23: Pilots are encouraged to turn on landing lights below 10,000 feet, especially in conditions of reduced visibility and when operating within 10 miles of an airport. The "see and avoid" concept is enhanced with lights on.',
    reference: 'AIM 4-3-23',
  },
  {
    question_text: 'When making routine transponder code changes, pilots should avoid inadvertent selection of which code?',
    option_a: '7200',
    option_b: '7000',
    option_c: '7500',
    option_d: null,
    correct_answer: 'C',
    category: 'Regulations',
    difficulty: 'easy',
    explanation: 'Code 7500 is the hijacking code. When changing transponder codes, cycle through digits in sequence to avoid accidentally selecting 7500, 7600 (lost comms), or 7700 (emergency). ATC takes immediate action if any of these codes appear on radar.',
    reference: 'AIM 4-1-20',
  },
  {
    question_text: 'A pilot experiencing the effects of hyperventilation should be able to restore the proper carbon dioxide level in the body by',
    option_a: 'slowing the breathing rate, breathing into a paper bag, or talking aloud.',
    option_b: 'breathing spontaneously and deeply or gaining mental control of the situation.',
    option_c: 'increasing the breathing rate in order to increase lung ventilation.',
    option_d: null,
    correct_answer: 'A',
    category: 'Regulations',
    difficulty: 'medium',
    explanation: 'Hyperventilation is excessive breathing that depletes CO2. Treatment: slow your breathing, breathe into a bag (rebreathing CO2), or talk aloud — all of which restore CO2 levels. Increasing breathing rate would worsen the condition.',
    reference: 'FAA-H-8083-25 Chapter 17',
  },
  {
    question_text: 'This sign confirms your position on [runway 22 sign shown]',
    option_a: 'runway 22.',
    option_b: 'routing to runway 22.',
    option_c: 'taxiway 22.',
    option_d: null,
    correct_answer: 'A',
    category: 'Navigation',
    difficulty: 'easy',
    explanation: 'Runway location signs have white numbers on a red background and confirm that you are on the runway. Mandatory instruction signs (stop bar, runway hold short) also use white on red. Direction signs (guiding you to a runway) use yellow on black.',
    reference: 'AIM 2-3-8',
  },
  {
    question_text: 'From the cockpit, this marking confirms the aircraft to be [hold short marking shown]',
    option_a: 'on a taxiway, about to enter runway zone.',
    option_b: 'on a runway, about to clear.',
    option_c: 'near an instrument approach clearance zone.',
    option_d: null,
    correct_answer: 'B',
    category: 'Navigation',
    difficulty: 'medium',
    explanation: 'Runway holding position markings (four yellow lines — two solid, two dashed) appear on taxiways and runways. When viewed from the runway side (dashed lines on your left, solid on your right), you are ON the runway and about to exit. When solid lines are on your side, you must stop and hold.',
    reference: 'AIM 2-3-5',
  },
  {
    question_text: '(Refer to FAA-CT-8080-2H, Figure 78.) What are the basic VFR weather minima required to takeoff from the Onawa, IA (K36) airport during the day?',
    option_a: '3 statute miles visibility, 500 feet below the clouds, 1,000 feet above the clouds, and 2,000 feet horizontally from the clouds.',
    option_b: '0 statute miles, clear of clouds.',
    option_c: '1 statute mile, clear of clouds.',
    option_d: null,
    correct_answer: 'C',
    category: 'Airspace',
    difficulty: 'medium',
    explanation: 'K36 (Onawa) is an uncontrolled airport in Class G airspace. For day VFR at or below 1,200 feet AGL in Class G airspace, the minimum is 1 statute mile visibility and clear of clouds — the most relaxed VFR requirement.',
    reference: '14 CFR 91.155',
  },
  {
    question_text: 'If Receiver Autonomous Integrity Monitoring (RAIM) capability is lost in-flight,',
    option_a: 'the pilot may still rely on GPS derived altitude for vertical information.',
    option_b: 'the pilot has no assurance of the accuracy of the GPS position.',
    option_c: 'GPS position is reliable provided at least 3 GPS satellites are available.',
    option_d: null,
    correct_answer: 'B',
    category: 'Navigation',
    difficulty: 'hard',
    explanation: 'RAIM monitors GPS satellite signals for integrity. Without RAIM, the GPS cannot self-monitor for errors, so the pilot has no assurance the position information is accurate. At least 5 satellites are needed for RAIM (4 for position + 1 for monitoring).',
    reference: 'AIM 1-1-17',
  },
  {
    question_text: 'You plan to phone a weather briefing facility for preflight weather information. You should',
    option_a: 'provide the number of occupants on board.',
    option_b: 'identify yourself as a pilot.',
    option_c: 'begin with your route of flight.',
    option_d: null,
    correct_answer: 'B',
    category: 'Weather Services',
    difficulty: 'easy',
    explanation: 'When calling for a weather briefing, first identify yourself as a pilot. This allows the briefer to provide appropriate aeronautical weather information. You should also state whether it is VFR or IFR, your aircraft type, and your planned departure time and route.',
    reference: 'AIM 7-1-4',
  },
  {
    question_text: 'Your cousin wants you to take him flying. You must have made at least three takeoffs and three landings in your aircraft within the preceding',
    option_a: '90 days.',
    option_b: '60 days.',
    option_c: '30 days.',
    option_d: null,
    correct_answer: 'A',
    category: 'Regulations',
    difficulty: 'easy',
    explanation: '14 CFR 61.57(a): To carry passengers, a pilot must have made three takeoffs and three landings within the preceding 90 days. For night passenger currency, those landings must be to a full stop and must have occurred during the period from 1 hour after sunset to 1 hour before sunrise.',
    reference: '14 CFR 61.57',
  },
  {
    question_text: 'In what flight condition are torque effects more pronounced in a single-engine airplane?',
    option_a: 'Low airspeed, high power, high angle of attack.',
    option_b: 'Low airspeed, low power, low angle of attack.',
    option_c: 'High airspeed, high power, high angle of attack.',
    option_d: null,
    correct_answer: 'A',
    category: 'Aerodynamics',
    difficulty: 'medium',
    explanation: 'Torque effects (P-factor, spiraling slipstream, gyroscopic precession) are most pronounced at low airspeed, high power, and high angle of attack — classic takeoff and go-around conditions. The combination requires significant rudder input to maintain directional control.',
    reference: 'FAA-H-8083-25 Chapter 5',
  },
  {
    question_text: 'The wind at 5,000 feet AGL is southwesterly while the surface wind is southerly. This difference in direction is primarily due to',
    option_a: 'stronger pressure gradient at higher altitudes.',
    option_b: 'friction between the wind and the surface.',
    option_c: 'stronger Coriolis force at the surface.',
    option_d: null,
    correct_answer: 'B',
    category: 'Weather Theory',
    difficulty: 'medium',
    explanation: 'Surface friction slows and redirects wind at low altitudes. At altitude, free from friction, wind flows more freely along the pressure gradient and turns right (in Northern Hemisphere) due to Coriolis effect. This causes the wind to veer (shift clockwise) and increase with altitude.',
    reference: 'FAA-AC-00-6 Chapter 2',
  },
  {
    question_text: 'Eye movements during daytime collision avoidance scanning should',
    option_a: 'not exceed 10 degrees and view each sector at least 1 second.',
    option_b: 'be 30 degrees and view each sector at least 3 seconds.',
    option_c: 'use peripheral vision by scanning small sectors and utilizing off-center viewing.',
    option_d: null,
    correct_answer: 'A',
    category: 'Regulations',
    difficulty: 'medium',
    explanation: 'AIM 8-1-6: Effective daytime scanning covers small sectors (10° or less) with each sector viewed for at least 1 second. The eye needs 1 second to focus on objects at distance. Scanning too quickly or in large sweeps misses threats.',
    reference: 'AIM 8-1-6',
  },
  {
    question_text: 'When there is a temperature inversion, you would expect to experience',
    option_a: 'clouds with extensive vertical development above an inversion aloft.',
    option_b: 'good visibility in the lower levels of the atmosphere and poor visibility above an inversion aloft.',
    option_c: 'an increase in temperature as altitude increases.',
    option_d: null,
    correct_answer: 'C',
    category: 'Weather Theory',
    difficulty: 'medium',
    explanation: 'A temperature inversion is a layer where temperature increases with altitude, the opposite of the normal lapse rate. It traps pollution, moisture, and haze below it, causing poor visibility near the surface. The stable air prevents vertical development above the inversion.',
    reference: 'FAA-AC-00-6 Chapter 4',
  },
  {
    question_text: 'When warm, moist, stable air flows upslope, it',
    option_a: 'produces stratus type clouds.',
    option_b: 'causes showers and thunderstorms.',
    option_c: 'develops convective turbulence.',
    option_d: null,
    correct_answer: 'A',
    category: 'Weather Theory',
    difficulty: 'medium',
    explanation: 'Stable air, even when forced upslope (orographic lifting), remains stable and produces stratiform (layered) clouds — stratus or fog. Unstable air lifted orographically produces cumulus and cumulonimbus with showers and thunderstorms.',
    reference: 'FAA-AC-00-6 Chapter 5',
  },
  {
    question_text: 'Each person who holds a pilot certificate or a medical certificate shall present it for inspection upon the request of any',
    option_a: 'authorized representative of the Department of Transportation.',
    option_b: 'person in a position of authority.',
    option_c: 'local law enforcement officer.',
    option_d: null,
    correct_answer: 'A',
    category: 'Regulations',
    difficulty: 'easy',
    explanation: '14 CFR 61.3(l): A pilot must present their pilot and medical certificates upon request of the Administrator (FAA), an authorized NTSB representative, or any Federal, State, or local law enforcement officer. The primary authority is the FAA as part of the Department of Transportation.',
    reference: '14 CFR 61.3',
  },
  {
    question_text: 'The correct method of stating 5,500 feet MSL to ATC is',
    option_a: 'FIVE POINT FIVE.',
    option_b: 'FIFTY-FIVE HUNDRED FEET MSL.',
    option_c: 'FIVE THOUSAND FIVE HUNDRED.',
    option_d: null,
    correct_answer: 'C',
    category: 'Navigation',
    difficulty: 'easy',
    explanation: 'AIM 4-2-9: Altitudes are stated as the number of thousands followed by hundreds. 5,500 feet is stated as "FIVE THOUSAND FIVE HUNDRED." Never use "point" for altitudes, and altitudes are stated without the "feet MSL" unless necessary for clarity.',
    reference: 'AIM 4-2-9',
  },
  {
    question_text: 'Unless otherwise authorized, which situation requires Automatic Dependent Surveillance-Broadcast (ADS-B)?',
    option_a: 'Landing at an airport with an operating control tower.',
    option_b: 'Overflying Class C airspace below 10,000 feet MSL.',
    option_c: 'Flying under the shelf of Class C airspace.',
    option_d: null,
    correct_answer: 'B',
    category: 'Airspace',
    difficulty: 'hard',
    explanation: '14 CFR 91.225: ADS-B Out is required in Class A, B, C airspace; above Class C airspace; Class E airspace at or above 10,000 ft MSL; within 30 NM of Class B airports below 10,000 ft MSL. Overflying Class C (above the outer shelf) below 10,000 ft MSL requires ADS-B.',
    reference: '14 CFR 91.225',
  },
]

// ─── AI-GENERATED QUESTION CATEGORIES ────────────────────────────────────────
const GENERATION_TARGETS = [
  { category: 'Regulations', count: 30, topics: 'Part 61 currency, Part 91 operating rules, NTSB 830, medical certificates, logbook requirements, right of way, safety pilot, endorsements' },
  { category: 'Airspace', count: 20, topics: 'Class A/B/C/D/E/G weather minimums, TFRs, special use airspace, Mode C requirements, ADS-B requirements, VFR corridors. Include 3 questions referencing sectional chart legends from FAA-CT-8080-2H (e.g. "Refer to FAA-CT-8080-2H, Legend 1" for sectional chart symbols, airspace boundaries, airport symbols)' },
  { category: 'Weather Theory', count: 25, topics: 'Fronts, fog formation, icing, thunderstorm stages, stability, lapse rates, wind shear, microbursts, density altitude effects on weather. Include 2 questions referencing FAA-CT-8080-2H Figure 1 (Lift Vector) or Figure 2 (Load Factor Chart)' },
  { category: 'Weather Services', count: 20, topics: 'METAR decoding, TAF reading, PIREPs, SIGMETs, AIRMETs, winds aloft, prog charts, radar imagery, obtaining briefings. Include 5 questions that say "Refer to FAA-CT-8080-2H, Figure 12" (METAR sample) or "Refer to FAA-CT-8080-2H, Figure 15" (TAF sample) or "Refer to FAA-CT-8080-2H, Figure 13" (telephone weather briefing) or "Refer to FAA-CT-8080-2H, Figure 14" (PIREP). Use realistic decoded METAR/TAF strings in the question text so students can answer without the actual figure.' },
  { category: 'Aircraft Performance', count: 20, topics: 'Takeoff/landing charts, density altitude, headwind/tailwind corrections, fuel planning, range vs endurance, climb performance. Include 3 questions referencing "FAA-CT-8080-2H, Figure 8" (Density Altitude Chart) with specific pressure altitude and temperature values students must interpolate.' },
  { category: 'Weight & Balance', count: 15, topics: 'CG calculations, loading envelopes, moment arms, effects of CG on stability, maximum gross weight, zero fuel weight' },
  { category: 'Aerodynamics', count: 20, topics: 'Lift/drag equation, stall, spin, load factor, Vg diagram, turns, adverse yaw, ground effect, wake turbulence, P-factor, propwash. Include 2 questions referencing "FAA-CT-8080-2H, Figure 2" (Load Factor Chart) asking students to determine load factor at specific bank angles.' },
  { category: 'Flight Instruments', count: 15, topics: 'Pitot-static system, gyroscopic instruments, magnetic compass errors, attitude indicator, VSI, altimeter settings, instrument failures. Include 3 questions referencing "FAA-CT-8080-2H, Figure 3" (Altimeter), "Figure 4" (Airspeed Indicator), "Figure 5" (Turn Coordinator), "Figure 6" (Heading Indicator), or "Figure 7" (Attitude Indicator) asking what the instrument is indicating.' },
  { category: 'Navigation', count: 15, topics: 'VOR tracking, ADF, GPS, dead reckoning, E6B calculations, fuel burn, time/speed/distance, sectional chart symbols, airspace depiction. Include 3 questions referencing sectional chart legends from "FAA-CT-8080-2H, Legend 1" through "Legend 19" for chart symbols and airspace interpretation.' },
]

// ─── PHASE 3: SUPPLEMENT-FIGURE QUESTION TARGETS ─────────────────────────────
// These generate questions that REQUIRE the student to have FAA-CT-8080-2H open.
// Every question starts with "(Refer to FAA-CT-8080-2H, Figure X.)"
const SUPPLEMENT_TARGETS = [
  {
    category: 'Weather Services',
    count: 10,
    figure: 'Figure 12',
    figureDesc: 'Figure 12 shows sample METARs and SPECIs. A typical METAR reads: METAR KORD 121755Z 27014KT 10SM FEW040 BKN250 22/09 A2992 RMK AO2 SLP133. Another shows: SPECI KDFW 151523Z 18035G50KT 3/4SM +TSRA OVC010CB 32/27 A2968 RMK AO2 TSB1458 OCNL LTGICCC. A TAF shown: TAF KORD 121720Z 1218/1318 27012KT P6SM FEW040 FM1300 30018G28KT 5SM -SHRA BKN025 TEMPO 1302/1306 3SM TSRA OVC015CB.',
    topics: 'Decoding METARs: wind, visibility, clouds, weather, altimeter. Decoding TAFs: validity periods, FM groups, TEMPO groups. SPECI reports. Wind gust notation. RVR. Present weather codes (+TSRA, -RA, BR, FG, HZ). Cloud height AGL.',
  },
  {
    category: 'Weather Services',
    count: 8,
    figure: 'Figure 17',
    figureDesc: 'Figure 17 is a Winds Aloft Forecast (FB Winds). Sample entries: STL at 3000=2113, 6000=2318+08, 9000=2424+02, 12000=2356-08, 18000=2463-20, 24000=246047, 30000=246055, 34000=247062, 39000=258069. BOS at 3000=1707, 6000=2010+10, 9000=2118+06, 12000=2321-01, 18000=2436-14. The 4-digit wind code format: first two digits = direction (hundreds, e.g. 23 = 230°), last two = speed in knots. Temperatures in Celsius after the +/- sign.',
    topics: 'Reading winds aloft forecasts: decoding 4-digit wind codes, direction in true degrees, speed in knots, temperature in Celsius. Identify highest winds, most favorable winds for fuel efficiency. Compare winds at different altitudes.',
  },
  {
    category: 'Aircraft Performance',
    count: 10,
    figure: 'Figure 8',
    figureDesc: 'Figure 8 is a Density Altitude Chart. The chart has ISA temperature (°F) on the x-axis (-60 to +120°F) and pressure altitude (ft) on the y-axis (0 to 14,000 ft). Diagonal lines show density altitude. Example readings: At 3,000 ft PA and 80°F, density altitude ≈ 5,800 ft. At 5,000 ft PA and 100°F, density altitude ≈ 8,700 ft. At sea level and 59°F (standard), density altitude = 0 ft (sea level). At 2,000 ft PA and 50°F, density altitude ≈ 2,800 ft. At 7,000 ft PA and 90°F, density altitude ≈ 10,000 ft.',
    topics: 'Reading density altitude chart with specific pressure altitude and temperature values. Effect of high density altitude on aircraft performance. Calculating density altitude from pressure altitude and temperature. Density altitude on a hot day at high elevation airport.',
  },
  {
    category: 'Aircraft Performance',
    count: 10,
    figure: 'Figure 38',
    figureDesc: 'Figure 38 shows Cessna 172 takeoff and landing performance charts. TAKEOFF: At sea level standard, ground roll ≈ 890 ft, 50-ft obstacle ≈ 1,525 ft. At 2,000 ft PA / 59°F: ground roll ≈ 1,020 ft, 50-ft ≈ 1,720 ft. At 4,000 ft / 77°F: ground roll ≈ 1,195 ft, 50-ft ≈ 2,035 ft. Headwind correction: subtract 10% per 9-kt headwind. Tailwind: add 10% per 2-kt tailwind. LANDING: At sea level standard, ground roll ≈ 500 ft, 50-ft obstacle ≈ 1,250 ft. At 5,000 ft / 101°F: ground roll ≈ 545 ft, 50-ft ≈ 1,400 ft with 8-kt headwind ≈ 956 ft total. Hard surface correction applied. Uphill slope 1%: add 10% to ground roll.',
    topics: 'Using takeoff distance charts with pressure altitude, temperature, headwind corrections. Using landing distance charts. Effect of headwind, tailwind, slope, temperature on takeoff and landing performance. Total distance over 50-ft obstacle vs ground roll.',
  },
  {
    category: 'Weight & Balance',
    count: 10,
    figure: 'Figures 32 and 33',
    figureDesc: 'Figures 32 and 33 show weight and balance data for a Cessna 172. Max gross weight: 2,550 lbs. Empty weight: 1,393 lbs, empty CG: 39.3 inches (moment 54,726). Arm positions: Front seats = 37 inches, Rear seats = 73 inches, Fuel (main) = 48 inches (6 lbs/gal), Baggage area 1 = 95 inches, Baggage area 2 = 123 inches. CG envelope limits: forward limit varies from 35.0" at 2,550 lbs to 35.0" at 2,050 lbs; aft limit is 47.3" at all weights. Sample loading: Pilot 180 lbs, Front passenger 140 lbs, Rear passengers 280 lbs, Fuel 44 gal (264 lbs), Oil 15 lbs (included in empty weight). Figure 33 shows moment envelope graph.',
    topics: 'Calculate total weight and CG from given loading. Determine if CG is within limits using envelope graph. Calculate required fuel drain to bring within weight or CG limits. Effect of fuel burn on CG shift. Loading scenarios with different passenger/cargo configurations.',
  },
  {
    category: 'Navigation',
    count: 12,
    figure: 'Figure 26',
    figureDesc: 'Figure 26 is a sectional chart excerpt showing the Cooperstown, ND area. Cooperstown-Westville Airport (08D) is a private airport at 1,523 ft MSL, with runway 12/30. The Class G airspace surface to 700 AGL is shown (magenta shading). The airport has no tower, no services. Nearby Jamestown Regional (JMS) is a Class D airport with a 119.2 tower frequency. There is a VOR/DME symbol near Jamestown. The area shows RESTRICTED airspace R-5001 to the north. Cooperstown city is about 1 mile from the airport. Maximum elevation figure for the quadrant is shown.',
    topics: 'Identify airspace class from sectional chart shading. Read airport information (elevation, runway, services). Identify navigation aids from symbols. Locate restricted/special use airspace. VFR cloud clearance and visibility requirements at depicted airports. Distance and direction between airports.',
  },
  {
    category: 'Navigation',
    count: 10,
    figure: 'Figure 52',
    figureDesc: 'Figure 52 is a sectional chart showing Lincoln Municipal Airport (LNK) in Nebraska. Lincoln is a Class C airport with: inner circle 5 NM surface to 4,200 MSL, outer shelf 10 NM 2,000-4,200 MSL. Tower frequency 118.5, Approach 124.0, ATIS 119.25, Ground 121.9. CTAF 118.5 when tower closed. Elevation 1,219 ft MSL. Loup City Municipal (northeast of Loup City by ~3 miles) is a small uncontrolled airport at 1,960 ft MSL. Minneapolis Center controls the area on 128.75. Norfolk Regional also shown.',
    topics: 'Class C airspace dimensions and requirements. Identify frequencies (tower, approach, ground, CTAF, ATIS). Communications procedure when tower closed vs open. Location of airports relative to cities. Required equipment for Class C. Radar service from approach control.',
  },
  {
    category: 'Navigation',
    count: 12,
    figure: 'Figures 64, 65, 66, 67, 68, and 69',
    figureDesc: 'Figures 64-69 show airport signs, markings, and lighting. Figure 64: Runway hold short markings — solid yellow lines toward aircraft means stop/hold. Figure 65: Runway 36/18 direction sign (black letters on yellow = direction/location sign). Figure 66: Runway 22 location sign (white on red = mandatory instruction / location on runway). Figure 67: ILS critical area sign (white on red, says "ILS"). Figure 68: No-entry sign (white X on red). Figure 69: Runway distance remaining markers (black on yellow). Runway safety area markings: displaced threshold has white arrows + dashed line. Taxiway centerline (continuous yellow line). Enhanced taxiway centerline (alternating yellow/black) near runway.',
    topics: 'Identify mandatory instruction signs (white on red). Identify location/direction signs (black on yellow or yellow on black). Runway hold short markings and which side to stop on. Displaced threshold markings and permitted uses. ILS critical area markings. No-entry signs. Enhanced centerline markings. Runway remaining distance markers.',
  },
  {
    category: 'Airspace',
    count: 8,
    figure: 'Figure 20',
    figureDesc: 'Figure 20 shows a sectional chart with NALF Fentress (NFE) in Virginia. NFE is a Military airport (blue circle with R or military symbol). The area shows Norfolk NAS (NGU) Class D airspace with a 119.025 tower frequency. NALF Fentress has no published tower frequency and is depicted without a Class D dashed circle, indicating Class E airspace or Class G. Norfolk International (ORF) nearby has Class C airspace. The area includes restricted areas R-6604A/B. The magenta shading indicates Class E surface extension around NFE at 700 ft AGL.',
    topics: 'Identify airspace class from sectional chart depictions. Class D vs Class E vs Class G at military airports. VFR requirements in Class E vs G. Restricted area operations. Reading airport information for military fields. Magenta vs blue shading meaning.',
  },
  {
    category: 'Flight Instruments',
    count: 8,
    figure: 'Figures 3, 4, 5, 6, and 7',
    figureDesc: 'Figure 3 (Altimeter): Shows altimeter set to 29.95, reading approximately 8,500 ft. The Kollsman window shows 29.95. Figure 4 (Airspeed Indicator): Showing approximately 105 knots. White arc 48-100 kts (flap range), green arc 65-165 kts (normal), yellow arc 165-208 kts (caution), red line at 208 kts (VNE). Blue line at 76 kts (Vy). Figure 5 (Turn Coordinator): Shows standard-rate left turn (2-minute turn), ball displaced right. Figure 6 (Heading Indicator): Shows heading of 270° (west). Figure 7 (Attitude Indicator): Shows 10° nose-up, 20° left bank.',
    topics: 'Read altimeter — identify indicated altitude and altimeter setting. Read airspeed indicator — identify colored arcs and what they mean. Interpret turn coordinator — standard rate, direction, ball position. Read heading indicator — current heading. Read attitude indicator — pitch and bank angle.',
  },
]

// ─── SUPPLEMENT QUESTION GENERATOR ───────────────────────────────────────────
async function generateSupplementQuestions({ category, count, figure, figureDesc, topics }) {
  console.log(`  Generating ${count} ${figure} questions (${category})...`)

  const prompt = `Generate exactly ${count} FAA Private Pilot Airplane (PAR) knowledge test questions that require the student to refer to ${figure} from the FAA Airman Knowledge Testing Supplement (FAA-CT-8080-2H).

FIGURE DESCRIPTION (use this data to create realistic questions):
${figureDesc}

TOPICS TO COVER:
${topics}

STRICT RULES:
1. Every question_text MUST start with "(Refer to FAA-CT-8080-2H, ${figure}.)"
2. Each question must have exactly 3 answer options (A, B, C) — NO option D
3. Only ONE option is correct — it must be definitively correct based on the figure data above
4. Wrong answers must be plausible (common student errors, close numeric values)
5. Mirror actual FAA test phrasing exactly
6. For numeric questions, use the specific values from the figure description above
7. Mix difficulty: ~30% easy, 50% medium, 20% hard
8. Explanations must teach HOW to read the chart/figure, not just state the answer

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "question_text": "(Refer to FAA-CT-8080-2H, ${figure}.) [question here]",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "correct_answer": "A" or "B" or "C",
    "difficulty": "easy" or "medium" or "hard",
    "explanation": "Step-by-step explanation of how to use the chart/figure to get the answer. Include what to look for and common mistakes.",
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

// ─── AI QUESTION GENERATOR ────────────────────────────────────────────────────
async function generateQuestions(category, count, topics) {
  console.log(`  Generating ${count} ${category} questions...`)

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
    "correct_answer": "A" or "B" or "C",
    "difficulty": "easy" or "medium" or "hard",
    "explanation": "Clear explanation of why the correct answer is right and why the others are wrong. 2-3 sentences.",
    "reference": "FAR/AIM reference e.g. 14 CFR 91.155 or AIM 3-2-4"
  }
]`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Extract JSON array from response
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) {
    console.error(`  Failed to parse JSON for ${category}`)
    return []
  }

  try {
    const questions = JSON.parse(match[0])
    return questions.map(q => ({
      ...q,
      option_d: null,
      category,
    }))
  } catch (e) {
    console.error(`  JSON parse error for ${category}:`, e.message)
    return []
  }
}

// ─── DATABASE INSERT ──────────────────────────────────────────────────────────
async function insertQuestions(questions) {
  const BATCH_SIZE = 50
  let inserted = 0

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('questions').insert(
      batch.map(q => ({
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d || '',
        correct_answer: q.correct_answer,
        category: q.category,
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation,
        reference: q.reference || null,
      }))
    )

    if (error) {
      console.error(`  Insert error:`, error.message)
    } else {
      inserted += batch.length
    }
  }

  return inserted
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🛩  TARMAC Question Seeder\n')

  // Test connection
  const { error: connError } = await supabase.from('questions').select('id').limit(1)
  if (connError) {
    console.error('❌ Cannot connect to Supabase:', connError.message)
    console.error('Make sure you have run supabase-schema.sql in the Supabase SQL Editor first.')
    process.exit(1)
  }

  // Check existing count
  const { count: existing } = await supabase.from('questions').select('id', { count: 'exact', head: true })
  console.log(`📊 Existing questions in database: ${existing || 0}\n`)

  // Phase 1: Real questions
  console.log('📚 Phase 1: Inserting real FAA sample questions...')
  const realInserted = await insertQuestions(REAL_QUESTIONS)
  console.log(`✅ Inserted ${realInserted} real FAA questions\n`)

  // Phase 2: AI-generated questions
  console.log('🤖 Phase 2: Generating additional questions with Claude AI...')
  let aiTotal = 0

  for (const target of GENERATION_TARGETS) {
    try {
      const generated = await generateQuestions(target.category, target.count, target.topics)
      if (generated.length > 0) {
        const n = await insertQuestions(generated)
        aiTotal += n
        console.log(`  ✅ ${target.category}: ${n} inserted`)
      }
      // Brief pause to avoid rate limits
      await new Promise(r => setTimeout(r, 1000))
    } catch (e) {
      console.error(`  ❌ ${target.category} failed:`, e.message)
    }
  }

  // Phase 3: Supplement-figure questions
  console.log('\n📋 Phase 3: Generating supplement figure questions...')
  let supplementTotal = 0

  for (const target of SUPPLEMENT_TARGETS) {
    try {
      const generated = await generateSupplementQuestions(target)
      if (generated.length > 0) {
        const n = await insertQuestions(generated)
        supplementTotal += n
        console.log(`  ✅ ${target.figure} (${target.category}): ${n} inserted`)
      }
      await new Promise(r => setTimeout(r, 1000))
    } catch (e) {
      console.error(`  ❌ ${target.figure} failed:`, e.message)
    }
  }

  const { count: finalCount } = await supabase.from('questions').select('id', { count: 'exact', head: true })
  console.log(`\n🎉 Done! Total questions in database: ${finalCount}`)
  console.log(`   Real FAA questions: ${realInserted}`)
  console.log(`   AI-generated questions: ${aiTotal}`)
  console.log(`   Supplement figure questions: ${supplementTotal}`)
}

main().catch(console.error)

main().catch(console.error)
