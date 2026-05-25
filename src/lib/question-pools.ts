type QuestionType = 'situation' | 'checkride' | 'written'
interface PoolQuestion { question_text: string; question_type: QuestionType; context: string | null }

export const QOTD_POOL: PoolQuestion[] = [
  {
    question_text: "Tower issues a go-around without explanation while you're on short final. What is your immediate action, and what do you do after executing it?",
    question_type: 'situation',
    context: "VFR day, winds 060/8, visibility 10SM. You're in a C172 stabilized at 80 knots on a 3-degree glide path, 200 AGL.",
  },
  {
    question_text: "During preflight, your altimeter reads 150 feet higher than the published field elevation. Is the aircraft airworthy for your VFR cross-country, and how did you determine that?",
    question_type: 'written',
    context: null,
  },
  {
    question_text: "Your DPE asks you to explain crosswind component and walk them through how it affects your decision to land at the destination.",
    question_type: 'checkride',
    context: "Your destination reports winds 280/18G24. Runway 24 is the only available runway.",
  },
  {
    question_text: "Engine fails at 500 AGL immediately after takeoff. Walk us through every decision you make in the first 10 seconds.",
    question_type: 'situation',
    context: "C172, density altitude 4,500 ft, no suitable landing area directly ahead, subdivisions to both sides, a golf course 30 degrees left.",
  },
  {
    question_text: "What are the VFR cloud clearance requirements for Class E airspace below 10,000 ft MSL, and why do they exist?",
    question_type: 'written',
    context: null,
  },
  {
    question_text: "You encounter a stall at 2,000 AGL during a steep turn in the practice area. Describe your recovery and what you did wrong.",
    question_type: 'checkride',
    context: null,
  },
  {
    question_text: "Your radio fails inbound to a Class D airport. What exactly do you do, and what signals are you looking for from the tower?",
    question_type: 'situation',
    context: "You're 10 miles out, VFR day, standard pressure, transponder working.",
  },
  {
    question_text: "You have 34 gallons usable fuel, burn 8.5 GPH, and your leg is 2:45 with no fuel available at destination. Can you legally and safely make this flight?",
    question_type: 'written',
    context: "Day VFR flight, one alternate 45 NM past the destination.",
  },
  {
    question_text: "Your DPE asks why you're using so much trim during the approach and whether that's correct technique. How do you respond?",
    question_type: 'checkride',
    context: null,
  },
  {
    question_text: "You depart VFR on a cross-country and the ceiling drops to 900 AGL ahead. You're in Class G airspace below 1,200 AGL. What are your options and what do you do?",
    question_type: 'situation',
    context: "Night flight, 35 miles from departure, destination is 55 miles ahead.",
  },
  {
    question_text: "Two aircraft are converging head-on at the same altitude. Who yields, and what does each pilot do?",
    question_type: 'written',
    context: null,
  },
  {
    question_text: "During weight and balance, you calculate you're 8 pounds over max gross weight. What are your options, and is it ever okay to depart overweight?",
    question_type: 'checkride',
    context: null,
  },
  {
    question_text: "You're on takeoff roll behind a heavy jet that just departed. How much time do you wait, and what if ATC clears you immediately?",
    question_type: 'situation',
    context: "Boeing 757, same runway, wind calm. Tower says 'cleared for takeoff, no delay.'",
  },
  {
    question_text: "You get to the run-up area and realize you never got ATIS. The tower is issuing you taxi instructions. What do you do?",
    question_type: 'written',
    context: null,
  },
  {
    question_text: "You're established on downwind and realize you're 300 feet above traffic pattern altitude. Your DPE is watching. What do you do and say?",
    question_type: 'checkride',
    context: null,
  },
  {
    question_text: "You're cleared to cross runway 28L at Charlie and you see an aircraft on short final to that runway. What do you do?",
    question_type: 'situation',
    context: "Night, tower is busy, the landing aircraft has not been told to go around.",
  },
  {
    question_text: "A TFR is issued 30 minutes after your departure. You're currently in the TFR airspace. What should you have done, and what do you do now?",
    question_type: 'written',
    context: null,
  },
  {
    question_text: "Describe the difference between a forward slip and a sideslip. When would you use each, and how do you set them up?",
    question_type: 'checkride',
    context: null,
  },
  {
    question_text: "Your engine sputters and stops during cruise. You've been on the left tank for 2.5 hours. What's the first thing you check, and what does that tell you?",
    question_type: 'situation',
    context: "6,500 MSL, 45 miles from nearest airport, fuel gauges both show near-half.",
  },
  {
    question_text: "You're planning a cross-country and a NOTAM shows your destination VOR is out of service. How does this affect your flight plan and legal requirements?",
    question_type: 'written',
    context: null,
  },
  {
    question_text: "You feel confused and notice your fingertips tingling at 12,500 ft MSL. You haven't used supplemental oxygen. What is happening and what do you do?",
    question_type: 'situation',
    context: null,
  },
  {
    question_text: "Your DPE says: 'Tell me the conditions that make a short-field takeoff more dangerous than a normal takeoff from the same runway.'",
    question_type: 'checkride',
    context: "You're at a 3,800 ft grass strip, density altitude 3,200 ft, trees at the departure end.",
  },
  {
    question_text: "A cumulonimbus is 20 miles away and moving toward your route. ATC offers you a 10-mile deviation. Do you take it? What's your decision process?",
    question_type: 'situation',
    context: "VFR cross-country, your alternates are all below VFR minimums due to unrelated fog.",
  },
  {
    question_text: "Decode this METAR and tell me whether your flight is legal: KORD 141852Z 28019G28KT 3SM -TSRA BKN035CB OVC065 25/18 A2991.",
    question_type: 'written',
    context: "You're planning a local VFR flight within 50 nm.",
  },
  {
    question_text: "What VFR cruising altitude would you use flying eastbound at 7,500 ft? What rule governs this, and what is the purpose behind it?",
    question_type: 'written',
    context: null,
  },
  {
    question_text: "During your checkride, you accidentally deviate from your planned heading by 15 degrees for 3 minutes before catching it. How do you handle it professionally?",
    question_type: 'checkride',
    context: null,
  },
  {
    question_text: "Describe the IMSAFE checklist. Be specific — what does each letter cover and give an example of when it would prevent a flight.",
    question_type: 'written',
    context: null,
  },
  {
    question_text: "You're on final and realize you're going to land long with insufficient runway remaining. Describe your go-around procedure step by step.",
    question_type: 'checkride',
    context: "2,800 ft runway, your touchdown point is 900 ft in, you're in a C172 at 1,800 lbs.",
  },
  {
    question_text: "Your passenger becomes airsick on a turbulent cross-country. They're anxious and asking you to land immediately. How do you manage both the flight and the situation?",
    question_type: 'situation',
    context: "40 miles from your destination, 30 miles from the nearest airport, light turbulence, VFR conditions throughout.",
  },
  {
    question_text: "What's the difference between fuel exhaustion and fuel starvation? Give an example of each and how you'd diagnose them in flight.",
    question_type: 'written',
    context: null,
  },
]

export const QOTW_POOL: PoolQuestion[] = [
  {
    question_text: "Walk us through every decision you'd make from the moment you recognize you're entering IMC until you're safely on the ground. What are your priorities, in order?",
    question_type: 'situation',
    context: "Night VFR cross-country. You departed with a 3,000 ft ceiling. One hour into the flight the ceiling has dropped to 1,200 ft and you're flying in and out of clouds. You're not instrument rated. Nearest airports: one 12 miles behind you, one 18 miles ahead. Both reporting VFR but the weather is moving fast.",
  },
  {
    question_text: "Your passenger loses consciousness 40 miles from the nearest airport. Describe your full response — medical, communication, and flying — simultaneously.",
    question_type: 'situation',
    context: "You're cruising at 7,500 MSL, VFR, daytime, C172. Your passenger is a non-pilot adult who suddenly slumps over and is unresponsive. You have a phone and the aircraft radio.",
  },
  {
    question_text: "Your DPE asks you to debrief yourself on the entire cross-country portion of your checkride. What went well, what didn't, and what would you do differently?",
    question_type: 'checkride',
    context: "You flew a 60-nm cross-country with two planned checkpoints. You were 5 minutes late to the first checkpoint, correctly identified the second, and arrived at the destination 200 ft above your planned altitude. ATC deviated you 8 miles for traffic.",
  },
  {
    question_text: "You're VFR at 5,500 ft and your oil pressure drops to zero. You have 8 minutes of engine life, maybe less. Walk through your emergency, landing site selection, and what you'd tell ATC and your passenger.",
    question_type: 'situation',
    context: "Flat agricultural terrain below. Nearest paved airport is 14 miles. There are multiple farm fields in range, power lines visible in the area. Winds 270/12.",
  },
  {
    question_text: "Explain aeronautical decision-making (ADM) and the PAVE checklist. Then apply PAVE to a scenario and explain why you'd go or no-go.",
    question_type: 'checkride',
    context: "Proposed flight: 120 nm cross-country, 6AM departure, forecast shows widespread fog lifting by 10AM, destination clear. Pilot has 90 hours TT, last flight 5 weeks ago. Aircraft has a slightly out-of-tolerance alternator noted in the squawk book.",
  },
  {
    question_text: "You're on a 3-mile final when the aircraft ahead lands and veers hard left into the grass. ATC clears you to land. What do you do and what factors drive your decision?",
    question_type: 'situation',
    context: "Tower says 'cleared to land, aircraft on runway, emergency equipment responding.' Winds favor the runway, no alternate runways available. You have 40 minutes of fuel remaining.",
  },
  {
    question_text: "Your fuel gauges both read 1/4 tank, you're 65 miles from destination, and you're burning 9 GPH at 120 knots groundspeed. Do you divert? Show your math and decision process.",
    question_type: 'situation',
    context: "C172S, 56 gallons usable total, you departed with full fuel 2.5 hours ago, cruised at 9 GPH. Winds aloft are a 15-knot headwind. Nearest airport with fuel is 22 miles left of course.",
  },
  {
    question_text: "You're transiting a complex airspace environment and realize you've entered Class B without a clearance. Describe exactly what you do, what regulations you violated, and what you should have done to prevent it.",
    question_type: 'written',
    context: null,
  },
  {
    question_text: "A large jet lands 45 seconds ahead of you on the same runway. You touch down, and as you decelerate through 60 knots you feel a sudden violent yaw and roll to the right. What happened, what do you do, and what should you have done?",
    question_type: 'situation',
    context: "Boeing 737, same runway, 8,500 ft available. Calm winds. You touched down at the numbers.",
  },
  {
    question_text: "Your DPE asks you to make a go/no-go decision on a flight that has 4 marginal factors, none of which alone would cancel the flight. How do you approach that decision and what framework do you use?",
    question_type: 'checkride',
    context: "Factors: (1) you're slightly fatigued from poor sleep, (2) forecast shows possible afternoon thunderstorms at destination, (3) winds at destination are 90-degree crosswind at 15 knots gusting 22, (4) the aircraft had a magneto check that was slightly rough but within limits.",
  },
  {
    question_text: "You're shooting a visual approach in strong gusty crosswinds and realize at 50 ft AGL that you're drifting toward the runway edge. Do you land or go around, and exactly how do you execute your decision?",
    question_type: 'checkride',
    context: "Winds 310/18G26, Runway 27, 4,200 ft available. Aircraft is a C172. You've already executed one go-around.",
  },
  {
    question_text: "Describe the regulations governing VFR flight in and around Class B, C, D, and E airspace. Then explain why each class exists and what real-world situations they're designed to handle.",
    question_type: 'written',
    context: null,
  },
  {
    question_text: "You're on approach in light turbulence when you notice the VASI shows all white, you're 400 ft above glide path, and you're fast. What went wrong, and how do you fix it without going around?",
    question_type: 'checkride',
    context: null,
  },
  {
    question_text: "You've just completed a successful engine-out landing in a farm field. The aircraft is intact, everyone is uninjured. Walk through everything you need to do in the next 30 minutes.",
    question_type: 'situation',
    context: "Remote area, 8 miles from a small town. Your phone has one bar of service. The field belongs to a farmer whose barn is 300 meters away.",
  },
  {
    question_text: "A new student asks you: 'What's the most important thing you've learned about flying that you wish someone had told you before your first solo?' Answer honestly and in detail.",
    question_type: 'checkride',
    context: null,
  },
]

export function getDailyQuestion(dateStr: string): PoolQuestion {
  const d = new Date(dateStr + 'T00:00:00Z')
  const startOfYear = new Date(d.getUTCFullYear() + '-01-01T00:00:00Z')
  const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000)
  return QOTD_POOL[dayOfYear % QOTD_POOL.length]
}

export function getWeeklyQuestion(weekStart: string): PoolQuestion {
  const EPOCH = new Date('2024-01-01T00:00:00Z')
  const d = new Date(weekStart + 'T00:00:00Z')
  const weekSlot = Math.floor((d.getTime() - EPOCH.getTime()) / (7 * 86400000))
  return QOTW_POOL[((weekSlot % QOTW_POOL.length) + QOTW_POOL.length) % QOTW_POOL.length]
}

export function getCurrentWeekStartStr(): string {
  const now = new Date()
  const day = now.getUTCDay() || 7
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - (day - 1))
  return monday.toISOString().slice(0, 10)
}
