/**
 * Phase 4 -- Batch 3: substantive FAA-source verification.
 *
 * Category: "Regulations" (PPL), next 33 unverified questions by id.
 * Every question independently checked against current eCFR text (14 CFR
 * Part 61/91, 49 CFR Part 830) or the live FAA AIM HTML page, fetched via
 * the Browser pane.
 *
 * Disposition:
 *   - 22 questions: correct as-is. No content change. Marked verified.
 *   - 2 real CORRECT-ANSWER ERRORS:
 *     - 4155cdb7: marked "an accident" for a precautionary landing with
 *       damage limited to the landing gear. 49 CFR 830.2 EXPLICITLY
 *       excludes "damage to landing gear, wheels, tires, flaps, engine
 *       accessories, brakes, or wingtips" from the definition of
 *       "substantial damage" -- with no injury described, this does not
 *       meet the definition of "accident" at all. correct_answer changed
 *       A -> B (incident).
 *     - 5d0f19a9: the entire premise was backwards. It claimed 10,500 ft
 *       MSL is NOT valid for a 185 degree magnetic course, but 91.159(a)(2)
 *       requires EVEN-thousand+500 for courses 180-359 degrees, and 10,000
 *       is an even thousand -- so 10,500 ft IS valid southbound. All three
 *       original options asserted 10,500 was invalid or misdescribed why
 *       it's valid. correct_answer changed A -> C, with C's text and the
 *       explanation corrected to state the right reasoning.
 *   - 9 more: correct answer, but a wrong CFR pinpoint citation, an
 *     explanation with a fabricated exception not in the regulation text,
 *     an internal contradiction ("Options B and C" naming the wrong two
 *     letters), an answer scope error (91.103(b) runway-length awareness
 *     applies to ANY flight, not just IFR/extended-over-water), or a
 *     stem/answer pairing that contradicted an already-verified question
 *     elsewhere in the bank (5c141e73 vs. Batch 1's 2cf81b0e on whether a
 *     radio station license is required aboard -- resolved by scoping
 *     5c141e73's stem to an international flight, where the ARROW answer
 *     including the radio license is correct). Corrected.
 *
 * Run: npx tsx scripts/audit-phase4-batch3.mts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const VERIFIED_BY = 'content-audit-2026-09-batch3'
const now = new Date().toISOString()

interface Update {
  id: string
  source_section: string
  reference?: string
  explanation?: string
  question_text?: string
  option_c?: string
  correct_answer?: string
  note: string
}

const updates: Update[] = [
  { id: '3ec34e43-f04c-4129-a88f-8863e1ff8c08', source_section: '49 CFR 830.5', note: 'Verified against current eCFR text (immediate notification "by the most expeditious means available" reasonably extends to "as soon as able to reach communications" when none exist at the accident site). No change.' },
  {
    id: '4003101f-a57e-4585-ae39-db3b0619f8e9', source_section: '14 CFR 91.207(e)-(f)',
    explanation: '14 CFR 91.207(a) generally requires an ELT on U.S.-registered civil airplanes, but 91.207(e) and (f) list specific exceptions, including: ferrying a newly acquired airplane to the place of ELT installation, or an airplane with an inoperative ELT to a place of repair (91.207(e)); and training operations conducted entirely within a 50 NM radius of the departure airport, aircraft certificated to carry only one person, and several other listed operations (91.207(f)). The general rule is that all U.S.-registered civil aircraft used in operations except those specifically excepted must have a functioning ELT.',
    note: 'Explanation contained a fabricated exception ("aircraft not certificated for use over water") that does not appear anywhere in 91.207, and mislabeled the 50 NM training exception as (e) when it is actually (f)(3). Rewritten to match the real exception list. Answer choice (option C) was already accurate and is unchanged.',
  },
  {
    id: '4155cdb7-d066-4f1b-bcaf-36b2a0cd575e', source_section: '49 CFR 830.2',
    correct_answer: 'B',
    reference: '49 CFR 830.2, 830.15',
    explanation: '49 CFR 830.2 explicitly excludes "damage to landing gear, wheels, tires, flaps, engine accessories, brakes, or wingtips" from the definition of "substantial damage" -- even when repair is required. Because this event involved no death or serious injury, and the only damage described was to the landing gear (a specifically excluded item), it does NOT meet the 830.2 definition of "accident." It is properly classified as an incident, and (per 830.15(a)) a report on an incident is filed only if requested by an authorized representative of the NTSB.',
    note: 'CORRECT-ANSWER ERROR, confirmed against the full current 830.2 text: landing-gear damage is expressly excluded from "substantial damage," so this scenario (no injury, gear-only damage) cannot be an "accident." Changed correct_answer from A to B.',
  },
  { id: '42107362-750f-4984-8828-f1e116d379cf', source_section: '14 CFR 91.155(a) (table, Class C)', note: 'Verified against current eCFR table. No change.' },
  { id: '4253a646-dfea-4539-ade6-89c9858b6125', source_section: '14 CFR 61.51(e)', note: 'Verified: matches established FAA legal-interpretation doctrine that a safety pilot and the pilot under the hood may simultaneously log PIC time on independent bases. No change.' },
  { id: '42aafb1b-005d-46d7-9dce-7b80e93e292e', source_section: '14 CFR 91.153; AIM 5-1-4', note: 'Explanation already correctly discloses that the "automatic activation" phrasing in the marked answer is imprecise but the best of the three options -- left as-is; no change needed.' },
  { id: '43ef8091-f366-4b26-b5df-48444b40ba13', source_section: '14 CFR 61.56(c)', note: 'Verified against current eCFR text. No change.' },
  { id: '459968dd-ffdc-46b7-a0d1-cc59313995a7', source_section: '14 CFR 91.155(a) (table, Class G <=1,200 ft, day)', note: 'Verified against current eCFR table. No change.' },
  { id: '45a35213-3cea-454e-89b0-d25b7a96ae1f', source_section: '14 CFR 61.57(b)(1)', note: 'Verified against current eCFR text -- correctly uses the "1 hour after sunset to 1 hour before sunrise" window (cf. the error corrected in Batch 2 item 2558aa0d). No change.' },
  { id: '45db32c1-28ad-40ce-8566-4b05726b580c', source_section: '14 CFR 91.151(a)(2)', note: 'Verified against current eCFR text. No change.' },
  {
    id: '45dcb0fa-fe4b-453b-b4e8-0b37a89a779e', source_section: '14 CFR 91.109(c)(2)',
    reference: '14 CFR 91.109(c)(2)',
    note: 'Citation corrected: the adequate-forward-and-side-vision requirement is 91.109(c)(2). (c)(1) is the certificate/rating requirement for the safety pilot, a different clause.',
  },
  {
    id: '47087ab3-97d1-4aef-96e3-e593639a033d', source_section: '14 CFR 91.103(a)-(b)',
    explanation: '14 CFR 91.103 requires the PIC to become familiar with all available information appropriate to the flight. Paragraph (a) covers IFR flights or flights not in the vicinity of an airport: weather reports and forecasts, fuel requirements, and alternatives if the planned flight cannot be completed. Paragraph (b) requires runway lengths and takeoff/landing distance data for ANY flight, not only IFR or extended-over-water flights. Option A is incomplete (omits alternatives and the universal runway-length requirement), and Option C does not capture the full scope of the regulation.',
    note: 'Content error: the stored answer said runway-length/performance data is required "for IFR or extended over-water flights" -- but 91.103(b) requires it for ANY flight. Explanation corrected; option B\'s own text already said "for any flight" runway lengths, so no option-text edit was needed, only the explanation\'s scope claim.',
  },
  {
    id: '47faedab-7ae2-42b9-92c6-a557701dc8b6', source_section: '14 CFR 61.87(n)',
    reference: '14 CFR 61.87(n)',
    note: 'Citation tightened: current 61.87(n) is a single unlettered paragraph (no "(n)(1)" subdivision) requiring the make/model solo endorsement within the preceding 90 days.',
  },
  { id: '48815251-a7f8-4854-b9b5-a4120eee869d', source_section: '14 CFR 61.23(a)(1)', note: 'Verified against current eCFR text. No change.' },
  { id: '48ba02a7-3ad2-4c95-b3ff-73974ab54c2a', source_section: '14 CFR 91.159(a)(2)', note: 'Verified against current eCFR text (270 degrees is in the 180-359 range -> even thousand + 500). No change.' },
  { id: '494f4021-08eb-4a16-b70d-7c455c9a4e44', source_section: '49 CFR 830.5', note: 'Verified against current eCFR text. No change.' },
  { id: '495acd7a-5845-4b02-b5bc-5f3675bc3724', source_section: '14 CFR 91.109(c)(1)(i)', note: 'Verified against current eCFR text. No change.' },
  { id: '4a896702-66c7-43b8-a9e3-aa0ab320c05b', source_section: '14 CFR 61.31(e)', note: 'Verified against current eCFR text. No change.' },
  { id: '4b053eab-f0db-4eca-980d-fd499230b422', source_section: '14 CFR 91.13', note: 'Verified -- 91.13 is titled "Careless or reckless operation." No change.' },
  {
    id: '4b0f13de-56ee-4391-85ac-c227b1584fa6', source_section: '14 CFR 61.93(b)(1); 61.93(c)(3)',
    reference: '14 CFR 61.93(b)(1); 61.93(c)(3)',
    note: 'Citation tightened for precision: the 25 NM training-flight rule is (b)(1); the per-flight solo cross-country endorsement content requirement is (c)(3), not a bare "(c)."',
  },
  {
    id: '50046719-de3c-4512-8d77-acc5b91c0d4f', source_section: '14 CFR 91.117(a)-(c)',
    explanation: '14 CFR 91.117(a) limits aircraft speed to 250 knots IAS below 10,000 feet MSL, including within Class B airspace -- 91.117(b) explicitly excludes Class B from its own, lower 200-knot restriction and says such operations "shall comply with paragraph (a)" instead. The 200-knot limit instead applies at or below 2,500 feet AGL within 4 NM of the primary airport of a Class C or Class D airspace area (91.117(b)), and in the airspace underlying Class B or in a VFR corridor through Class B (91.117(c)). The 288 figure is simply the mph equivalent of 250 knots given in the regulation\'s own text, not a separate knots limit.',
    note: 'Explanation overreached by claiming the 200-knot limit applies "in ... Class E surface areas," which is not in the regulation text (91.117(b) is scoped to Class C/D primary airports only). Rewritten to match current eCFR text precisely. Answer choice (250 knots) already correct and unchanged.',
  },
  {
    id: '53364cdd-9d74-4b7e-949d-a72fbe0375d0', source_section: '49 CFR 830.2; 830.5(a)(4)',
    explanation: 'Under 49 CFR 830.2, an accident requires substantial damage to the aircraft or a serious/fatal injury. An in-flight fire extinguished without substantial damage or injury does not meet that definition and is therefore an incident -- though in-flight fire is specifically listed under 830.5(a)(4) as one of the serious incidents requiring immediate notification regardless of whether it caused any damage. Options A and C both meet the accident definition (substantial damage from engine failure, and serious injury from a runway excursion, respectively).',
    note: 'Explanation had an internal contradiction: it correctly established that B (the stored correct answer) is an incident, then said "Options B and C both meet the accident definition" -- which is inconsistent with calling B an incident one sentence earlier. Corrected to "Options A and C." correct_answer (B) unchanged.',
  },
  {
    id: '562c24fa-5c5c-4fc7-91fe-8829485b2626', source_section: '14 CFR 91.155(a) (table, Class G <=1,200 ft, day)',
    reference: '14 CFR 91.155(a)',
    note: 'Citation corrected: the base Class G day/night VFR minimums (including the 1 SM / clear-of-clouds day figure tested here) are in the (a) table. (b) is a separate, narrower set of exceptions for helicopters and traffic-pattern operations in Class G, not the base minimums.',
  },
  {
    id: '5c141e73-edfe-4b29-b4ae-2f29bddbc75f', source_section: '14 CFR 91.9; 14 CFR 91.203; 47 CFR 87.18',
    question_text: 'Which documents must be aboard an aircraft during an international flight operation?',
    explanation: 'The ARROW mnemonic lists five documents required aboard the aircraft for an international flight: Airworthiness certificate and Registration (14 CFR 91.203), Radio station license (47 CFR 87.18 -- required for international operations, not domestic ones), Operating limitations, and Weight and balance data (14 CFR 91.9 and the aircraft\'s AFM). The pilot certificate is carried on the pilot\'s person under 61.3, not treated as an aircraft document, and maintenance records are not required to be aboard.',
    note: 'This question and Batch 1 item 2cf81b0e both test the ARROW document list but disagreed on whether a radio station license belongs on it -- because that requirement is genuinely conditional (international operations only, per 47 CFR 87.18, not 14 CFR 91.203). Rather than picking one as "wrong," scoped this question\'s stem to "an international flight operation," where including the radio license (option C) is correct, leaving it consistent with 2cf81b0e\'s correctly domestic-scoped answer. No answer-choice text changed.',
  },
  { id: '5d02f86e-f745-4f7d-80ea-4a5b2cf802e9', source_section: 'AIM 4-3-11', note: 'Verified against live FAA AIM chapter 4-3-11 LAHSO guidance -- matches essentially verbatim. No change.' },
  {
    id: '5d0f19a9-3fda-4ebd-a5c2-71a51af76e15', source_section: '14 CFR 91.159(a)(2)',
    correct_answer: 'C',
    option_c: '10,500 feet MSL is appropriate because it is an even thousand plus 500',
    explanation: '14 CFR 91.159(a)(2) requires that on a magnetic course of 180 through 359 degrees, aircraft fly at any EVEN-thousand-foot MSL altitude plus 500 feet (e.g., 8,500; 10,500; 12,500). Because 10,000 is an even thousand, 10,500 feet MSL is a valid, correct VFR cruising altitude for a magnetic course of 185 degrees. (On a course of 0-179 degrees, the rule instead requires an odd thousand plus 500, e.g., 9,500 or 11,500.)',
    note: 'CORRECT-ANSWER ERROR: the entire question premise was backwards. It asserted 10,500 ft is invalid for a 185-degree course, but 10,000 is an even thousand, so 10,500 ft correctly satisfies the southbound (180-359 deg) even-thousand-plus-500 rule. All three original options asserted or reasoned that 10,500 was invalid (A, B) or reached the right conclusion via wrong reasoning, calling it "an odd thousand plus 500" (C, incorrect -- 10,000 is even). Changed correct_answer to C and corrected C\'s text and the explanation to state the right reasoning.',
  },
  { id: '5de39ea9-1c87-40e0-a2ec-29ee88261c7c', source_section: '14 CFR 61.51(a)', note: 'Verified against current eCFR text. No change.' },
  { id: '5f23a4cd-8b40-443a-8836-aca1628fb35b', source_section: '49 CFR 830.15(a)', note: 'Verified against current eCFR text, including the 7-day overdue-aircraft exception noted in the explanation. No change.' },
  { id: '6259ce92-9299-4942-9b8c-9812ce2620f3', source_section: '14 CFR 91.113(g)', note: 'Verified against current eCFR text. No change.' },
  { id: '625ac075-ecdf-4811-a5ce-a34a36beaa5d', source_section: '49 CFR 830.2', note: 'Verified against current eCFR text -- matches the "substantial damage" definition and its exclusion list precisely. No change.' },
  { id: '6392e5cb-5ef8-4492-997e-01e2ed2b5465', source_section: '14 CFR 61.39(a)(1)(i)', note: 'Verified against current eCFR text. No change.' },
  { id: '64901f12-4208-478f-8ad9-d2cf405888fd', source_section: '14 CFR 61.56(c)', note: 'Verified against current eCFR text (calendar-month convention). No change.' },
  { id: '64a57bf1-f8af-46e3-8abe-3c769618f4e1', source_section: '14 CFR 91.119(c)', note: 'Verified against current eCFR text. No change.' },
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
    const logEntry = `[content-audit 2026-09-17 batch3] ${u.note}`
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
    if (u.question_text) patch.question_text = u.question_text
    if (u.option_c) patch.option_c = u.option_c
    if (u.correct_answer) patch.correct_answer = u.correct_answer

    const { error } = await supabase.from('questions').update(patch).eq('id', u.id)
    if (error) throw error
    ok++
  }
  const changed = updates.filter(u => u.reference || u.explanation || u.question_text || u.option_c || u.correct_answer).length
  console.log(`Batch 3 complete: ${ok}/${updates.length} questions updated (source_title/source_section/verified_at/verified_by set on all; ${changed} had a content/citation correction applied; 2 correct_answer changes).`)
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
