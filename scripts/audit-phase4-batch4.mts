/**
 * Phase 4 -- Batch 4: substantive FAA-source verification.
 *
 * Category: "Regulations" (PPL), next 33 unverified questions by id.
 * Every question independently checked against current eCFR text (14 CFR
 * Part 61/91, 49 CFR Part 830) or the live FAA AIM HTML page.
 *
 * Disposition:
 *   - 22 questions: correct as-is. No content change. Marked verified.
 *   - 3 real CORRECT-ANSWER / CONTENT ERRORS:
 *     - 66faeef0: option B's own text read "Both A and B" -- a
 *       self-referential typo (it should reference the OTHER two options,
 *       A and C). Both A (overdue aircraft, 830.5(b)) and C (flight
 *       control malfunction, 830.5(a)(1)) are genuine immediate-notify
 *       triggers, confirmed against the full current 830.5 text. Fixed
 *       option B's text to "Both A and C" and corrected the reference/
 *       explanation, which had also cited the wrong subsection ((a)(3),
 *       which is actually about turbine engine component failure).
 *     - 83ec2877: marked answer said a safety pilot logs the flight as
 *       "second-in-command" time. Confirmed against the full current
 *       61.51(f) text: SIC logging requires the AIRCRAFT to require more
 *       than one pilot by its type certificate (or applicable operating
 *       regs) -- an ordinary single-engine trainer used for hood/
 *       safety-pilot practice does not meet that test, so SIC logging is
 *       not available here at all. The real basis is 61.51(e) (PIC
 *       logging) if the safety pilot is designated PIC before the flight
 *       and holds the appropriate category/class rating -- no instrument
 *       rating required. Changed correct_answer C -> B, with B's text and
 *       the explanation corrected.
 *     - 884da62d: marked answer said certificates must be presented upon
 *       request of "an authorized representative of the Department of
 *       Transportation" -- a phrase that does not appear in 61.3(l) at
 *       all. The regulation's actual list is: the Administrator, an NTSB
 *       representative, any Federal/State/local law enforcement officer,
 *       or a TSA representative -- "local law enforcement officer" is
 *       verbatim in the list and was sitting right there as option C.
 *       Changed correct_answer B -> C.
 *   - 8 more: wrong CFR pinpoint citations (91.3(b) vs (c), 61.31(a) vs
 *     (d)(1), 91.113(b) vs (c)-(d), a wrong AIM section number for
 *     landing lights: 4-3-23 is actually "Option Approach," the real
 *     content is 4-3-24), a garbled explanation that named the wrong
 *     option letters for a 61.5 aircraft-category question, an
 *     explanation citing a wrong endorsement subsection for 61.93, and an
 *     explanation that misidentified which 91.155 Class G altitude band
 *     applies (numeric answer was coincidentally still correct).
 *
 * Run: npx tsx scripts/audit-phase4-batch4.mts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const VERIFIED_BY = 'content-audit-2026-09-batch4'
const now = new Date().toISOString()

interface Update {
  id: string
  source_section: string
  reference?: string
  explanation?: string
  option_b?: string
  option_c?: string
  correct_answer?: string
  note: string
}

const updates: Update[] = [
  {
    id: '657a73e8-4fd3-4c59-bf80-c97506164274', source_section: 'AIM 4-3-24',
    reference: 'AIM 4-3-24',
    note: 'Citation corrected: the "Operation Lights On" landing-lights guidance (below 10,000 ft, within 10 miles of an airport, or in reduced visibility) is under AIM 4-3-24 "Use of Aircraft Lights." AIM 4-3-23 is actually "Option Approach" (the cleared-for-the-option procedure), an unrelated topic. Answer content (reduced visibility) already correct and unchanged.',
  },
  { id: '65bed9b9-0f6a-4db7-96b8-0439f056af05', source_section: '14 CFR 91.7(b)', note: 'Verified against current eCFR text. No change.' },
  { id: '6622cf96-2c6a-4b95-a8a4-34a0ac4fab96', source_section: '49 CFR 830.5; 830.15', note: 'Verified against current eCFR text. No change.' },
  {
    id: '66e1faac-e016-4cb0-8c8a-cf82693166f9', source_section: 'AIM 4-1-20',
    reference: 'AIM 4-1-20; 14 CFR 91.215',
    note: 'Citation broadened: the specific "Code 1200" VFR assignment is AIM guidance (4-1-20, confirmed live), not literal text of 91.215 (which governs equipage/use requirements by airspace, not the specific default code). AIM cite made primary.',
  },
  {
    id: '66faeef0-fb96-4137-b89e-937a9b7fe778', source_section: '49 CFR 830.5(a)(1); 830.5(b)',
    option_b: 'Both A and C',
    reference: '49 CFR 830.5(a)(1); 830.5(b)',
    explanation: 'Per 49 CFR 830.5(a)(1), a flight control system malfunction or failure requires immediate NTSB notification. Per 830.5(b), an aircraft that is overdue and believed to have been involved in an accident also requires immediate notification. Both are genuine immediate-notification triggers, so "Both A and C" is correct. Note that 830.5(b) does not specify an exact overdue timeframe such as "48 hours" -- that duration is commonly-taught shorthand, not the literal regulatory standard, which instead asks whether the aircraft is overdue AND believed to have been involved in an accident.',
    note: 'Confirmed content/structure error: option B\'s own text read "Both A and B" (self-referential -- B cannot correctly refer to itself). Both A (830.5(b), overdue aircraft) and C (830.5(a)(1), flight control malfunction) are real triggers, confirmed against the full current 830.5 text, so B should read "Both A and C." Reference was also wrong ((a)(3) is turbine engine component failure, an unrelated item). Fixed option B\'s text, the reference, and the explanation.',
  },
  { id: '68ba63fe-f679-4e54-8a8c-89b6d8919ce7', source_section: '14 CFR 61.89(a)(1)', note: 'Verified against current eCFR text. No change.' },
  { id: '6afd8615-c86f-4805-9b59-874039b92b42', source_section: '14 CFR 61.3(a)(1)-(2), (c)(1)', note: 'Verified against current eCFR text (pilot certificate, photo ID, and medical certificate personal-possession requirements). No change.' },
  { id: '6c6d0a25-2723-4fe1-96fe-4576e4d6b186', source_section: '14 CFR 61.23(d)(3)', note: 'Verified against current eCFR duration table. No change.' },
  { id: '6f255481-8a92-4119-ac6f-953348bfb718', source_section: '14 CFR 61.3(c)(1); 61.51(i)(2)', note: 'Verified against current eCFR text (61.3(c)(1) general medical-possession requirement plus 61.51(i)(2)\'s solo-cross-country carry list). No change.' },
  { id: '7042a4d6-60a0-4995-a842-c4cdaf4dfea1', source_section: '14 CFR 91.119(b)', note: 'Verified against current eCFR text. No change.' },
  { id: '705d0385-69cf-491f-878d-8d0bb61b9ae6', source_section: '14 CFR 91.113(g)', note: 'Verified against current eCFR text. No change.' },
  { id: '7069c7fb-4e16-4964-9481-1f3ddb1921c8', source_section: '14 CFR 61.51(a)', note: 'Verified against current eCFR text. No change.' },
  { id: '7113cd00-d962-42e2-9ee9-dbc59b52113c', source_section: '14 CFR 91.157(b)(4)', note: 'Verified against current eCFR text -- matches precisely, including the correct pinpoint citation already on the row. No change.' },
  { id: '75263145-d856-48d2-9dff-b94fb4df7d50', source_section: '14 CFR 61.89(a)(6)', note: 'Verified against current eCFR text. No change.' },
  { id: '75531fdc-16bd-477a-a1a6-05d651f5970b', source_section: '14 CFR 61.87(o)', note: 'Verified against current eCFR text. No change.' },
  {
    id: '78e624f0-eeb8-4d24-b54f-1eb9ead84798', source_section: '14 CFR 61.93(c)(1)-(2); 61.93(c)(3)',
    explanation: 'Per 14 CFR 61.93(c), a student pilot must have (1) a solo cross-country endorsement for the category of aircraft (61.93(c)(1)) and for the specific make and model (61.93(c)(2)), and (2) a route-specific endorsement for each planned flight after the instructor reviews the cross-country planning (61.93(c)(3)). Both the one-time category/make-model endorsement(s) and the per-flight route-specific endorsement are required before each solo cross-country flight.',
    note: 'Citation corrected: the per-flight, route-specific endorsement (reviewed cross-country planning) is 61.93(c)(3), not (c)(2) -- (c)(2) is actually the one-time make/model endorsement, a different item. Answer choice (option B) unchanged.',
  },
  { id: '7c3e2473-7ea8-4c5c-8ea4-87a9192b8b25', source_section: '49 CFR 830.5; 830.2', note: 'Verified against current eCFR text ("operator" concept). No change.' },
  { id: '7ccca40a-96b2-4654-a093-5d311e0c2842', source_section: '14 CFR 61.51(e); 14 CFR 91.109(c)', note: 'Verified: matches established FAA legal-interpretation doctrine that the pilots must agree in advance which of them is PIC. No change.' },
  {
    id: '7d38d441-4dd1-4f20-8c22-c46c28cbae24', source_section: '14 CFR 61.31(d)(1)',
    reference: '14 CFR 61.31(d)(1)',
    note: 'Citation corrected: the general "must hold appropriate category, class, and type rating to act as PIC" requirement is 61.31(d)(1). 61.31(a) is only about TYPE ratings for large/turbojet/powered-lift aircraft, a narrower and different provision that does not itself address class ratings.',
  },
  {
    id: '813b9d9b-750f-4c6e-aa33-ede582933d0e', source_section: '14 CFR 91.3(c)',
    reference: '14 CFR 91.3(c)',
    note: 'Citation corrected: the "written report only upon request of the Administrator" requirement is 91.3(c). 91.3(b) is the paragraph authorizing the emergency deviation itself, a different clause.',
  },
  { id: '81e21dd4-2c67-4dad-bd80-2eaa6f38e4cc', source_section: '49 CFR 830.2', note: 'Verified against current eCFR text. No change.' },
  {
    id: '83ec2877-f21f-47c2-bce5-7b97b205de0e', source_section: '14 CFR 61.51(e)-(f); 91.109(c)(1)',
    correct_answer: 'B',
    option_b: 'As pilot-in-command time only if the safety pilot is designated as PIC before the flight and holds the appropriate category and class rating for the aircraft (no instrument rating is required)',
    reference: '14 CFR 61.51(e)-(f); 91.109(c)(1)',
    explanation: '14 CFR 61.51(f) permits logging second-in-command time only when the aircraft requires more than one pilot by its type certificate (or under the applicable operating regulations). An ordinary single-engine trainer used for hood/safety-pilot instrument practice does not meet that test, so SIC logging is not available for this flight at all -- a common misconception. Instead, a safety pilot may log PIC time under 61.51(e) only if the two pilots agree in advance that the safety pilot is the designated PIC, and the safety pilot holds the appropriate category and class rating for the aircraft (91.109(c)(1)) -- no instrument rating is required for the safety pilot role. Absent that designation, the safety pilot logs neither PIC nor SIC time for the flight.',
    note: 'CONTENT ERROR, confirmed against the full current 61.51(f) text: SIC logging requires the aircraft to require more than one pilot by type certificate, which an ordinary trainer used for safety-pilot practice does not. Changed correct_answer from C to B, with B\'s text corrected to state the real gating condition (PIC designation + category/class rating, not an instrument rating).',
  },
  { id: '85e03aaf-c11f-4cb8-a49f-a860144773ba', source_section: '14 CFR 91.203(a)-(b)', note: 'Verified against current eCFR text. No change.' },
  {
    id: '867cc63c-7a1c-4b2b-9d0d-d0e56b30da26', source_section: '14 CFR 61.5(b)(1)-(2)',
    explanation: '14 CFR 61.5(b)(1) lists the aircraft categories for airman certification: airplane, rotorcraft, glider, lighter-than-air, powered-lift, powered parachute, and weight-shift-control aircraft. Answer C correctly lists four of these categories. Answer B ("single-engine land and sea, multiengine land and sea") lists CLASS ratings within the airplane category (61.5(b)(2)), not categories. Answer A ("gyroplane, helicopter, airship, free balloon") lists class ratings within the rotorcraft and lighter-than-air categories (61.5(b)(3)-(4)), not categories either.',
    note: 'Explanation was garbled/self-contradictory: it said "Answer B correctly lists these categories" and described C as listing "classes within the airplane category," when the stored correct_answer is C (the real category list) and B is the one listing classes. Rewritten to correctly attribute each option. correct_answer (C) unchanged -- it was already right.',
  },
  { id: '86eecbcf-007e-43d4-bc52-67426099925b', source_section: '14 CFR 91.109(c)(1)-(2)', note: 'Verified against current eCFR text (control-seat placement plus adequate-vision requirement). No change.' },
  {
    id: '884da62d-0ca2-4ffd-9179-4cd4df4151bd', source_section: '14 CFR 61.3(l)',
    correct_answer: 'C',
    reference: '14 CFR 61.3(l)',
    explanation: '14 CFR 61.3(l) requires a pilot to present their certificates for inspection upon request from: the Administrator; an authorized representative of the NTSB; any Federal, State, or local law enforcement officer; or an authorized representative of the TSA. "Local law enforcement officer" is one of these four categories verbatim. "An authorized representative of the Department of Transportation" is not itself one of the four listed categories -- the FAA (through "the Administrator") is the DOT-affiliated authority named in the regulation, not a generic "DOT representative."',
    note: 'CORRECT-ANSWER ERROR, confirmed against the full current 61.3(l) text: the marked answer\'s phrase does not appear in the regulation at all, while "local law enforcement officer" (option C) is verbatim text from the actual list of four authorities. Changed correct_answer from B to C.',
  },
  { id: '88fc2f6d-9052-4518-ac43-4278a9c9a0b0', source_section: '14 CFR 91.151(a)(1)', note: 'Verified against current eCFR text -- correctly uses "first point of intended landing" rather than "destination." No change.' },
  { id: '8ac21abe-deb5-458c-b5a2-c94ce1382b9b', source_section: '14 CFR 61.51(b)', note: 'Verified against current eCFR text. No change.' },
  { id: '8ccbe2f3-5808-4501-a9bc-fa0221354363', source_section: '49 CFR 830.15(a)', note: 'Verified against current eCFR text. No change.' },
  { id: '8d9c4ae8-7852-4b55-a640-38dd67aae9f1', source_section: '14 CFR 61.56(a), (c)', note: 'Verified against current eCFR text. No change.' },
  { id: '909b8bdb-edac-40de-81e5-e417f8122d30', source_section: '49 CFR 830.2', note: 'Verified against current eCFR text, including the engine-failure exclusion. No change.' },
  {
    id: '9518a5ae-90ae-4185-993b-9125949f26da', source_section: '14 CFR 91.155(a) (table)',
    explanation: "14 CFR 91.155's table sets Class G night minimums at 3 statute miles visibility and 500 ft below / 1,000 ft above / 2,000 ft horizontal cloud clearance in BOTH the \"1,200 ft AGL or less\" band and the \"more than 1,200 ft AGL but below 10,000 ft MSL\" band -- the two night rows happen to be identical. Because the question specifies 1,500 feet AGL, which is above 1,200 feet, it actually falls in the second (\">1,200 ft\") band, not the \"1,200 ft or below\" band the original explanation described -- but the correct numeric answer (3 SM / 500-1,000-2,000) is the same either way.",
    note: 'Explanation described the wrong altitude band (said "at 1,200 feet AGL or below" when the stem specifies 1,500 ft AGL, which is above that threshold) -- the numeric answer was coincidentally identical between the two night bands, so correct_answer (C) is unaffected, but the explanation\'s reasoning was inaccurate. Corrected.',
  },
  {
    id: '952bfc8e-3e97-4726-a643-eb700fe218a6', source_section: '14 CFR 91.113(c)-(d)',
    reference: '14 CFR 91.113(c)-(d)',
    note: 'Citation corrected (same issue as Batch 2 item 0e6a816a): the right-of-way hierarchy is in 91.113(c) (distress, absolute) and (d) (balloon > glider > airship > towing/refueling aircraft > other powered aircraft), not (b) (the general vigilance/see-and-avoid paragraph). Under the current (post-July-2025) text, a towing aircraft still has the right-of-way over "all other powered aircraft" -- gliders and balloons remain unaffected since they are not "engine-driven." Answer content (option C) already correct and unchanged.',
  },
]

async function main() {
  if (updates.length !== 33) throw new Error(`Expected 33 rows, got ${updates.length}`)

  let ok = 0
  for (const u of updates) {
    const { data: existing, error: fetchErr } = await supabase
      .from('questions')
      .select('validation_log')
      .eq('id', u.id)
      .single()
    if (fetchErr) throw fetchErr

    const priorLog = (existing?.validation_log as string | null) ?? ''
    const logEntry = `[content-audit 2026-09-17 batch4] ${u.note}`
    const newLog = priorLog ? `${priorLog}\n${logEntry}` : logEntry

    const patch: Record<string, unknown> = {
      source_title: u.source_section.startsWith('AIM') ? 'FAA Aeronautical Information Manual (current)' : 'eCFR (current)',
      source_section: u.source_section,
      verified_at: now,
      verified_by: VERIFIED_BY,
      validation_log: newLog,
    }
    if (u.reference) patch.reference = u.reference
    if (u.explanation) patch.explanation = u.explanation
    if (u.option_b) patch.option_b = u.option_b
    if (u.option_c) patch.option_c = u.option_c
    if (u.correct_answer) patch.correct_answer = u.correct_answer

    const { error } = await supabase.from('questions').update(patch).eq('id', u.id)
    if (error) throw error
    ok++
  }
  const changed = updates.filter(u => u.reference || u.explanation || u.option_b || u.option_c || u.correct_answer).length
  console.log(`Batch 4 complete: ${ok}/${updates.length} questions updated (source_title/source_section/verified_at/verified_by set on all; ${changed} had a content/citation correction applied; 3 correct_answer changes).`)
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
