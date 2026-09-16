/**
 * Phase 4 -- Batch 2: substantive FAA-source verification.
 *
 * Category: "Regulations" (PPL), first 33 questions by id. Every question
 * independently checked against the current eCFR text of its cited 14 CFR
 * Part 61/91 or 49 CFR Part 830 section, or the live FAA AIM HTML page for
 * AIM-cited items (fetched via the Browser pane, not model memory).
 *
 * Disposition:
 *   - 25 questions: correct as-is. No content change. Marked verified.
 *   - 1 REJECTED (280ee573): question stem is incoherent -- it references
 *     "a pilot with less than the required minimum safe airspeed"
 *     transferring control under 91.109, a concept that does not exist
 *     anywhere in that section or elsewhere in Part 91. Cannot be
 *     corrected without inventing new question content, which is out of
 *     scope for a verification pass -- rejected instead.
 *   - 1 real CORRECT-ANSWER ERROR (2558aa0d): marked correct answer said
 *     the night passenger-carrying currency window is "between sunset and
 *     sunrise." 14 CFR 61.57(b)(1) actually specifies the narrower
 *     "1 hour after sunset to 1 hour before sunrise" -- which was sitting
 *     right there as option B. correct_answer changed A -> B.
 *   - 1 regulatory-CHANGE case (0e6a816a): 91.113(d) was amended in July
 *     2025 (Amdt. 91-381) and no longer lists a separate "powered
 *     parachute / weight-shift-control aircraft" tier in the right-of-way
 *     hierarchy. The stored explanation described the old 5-tier order.
 *     The tested answer (glider beats all powered aircraft) is still
 *     correct under the current rule; explanation and citation corrected.
 *   - 5 more: correct answer, but a wrong CFR pinpoint citation, an
 *     explanation with a straight self-contradiction (references "Answer
 *     A" when the correct answer is C), or an answer choice whose
 *     "unless" exception directly contradicts the cited absolute
 *     prohibition. Corrected.
 *
 * Run: npx tsx scripts/audit-phase4-batch2.mts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const VERIFIED_BY = 'content-audit-2026-09-batch2'
const now = new Date().toISOString()

interface Update {
  id: string
  source_section: string
  reference?: string
  explanation?: string
  option_a?: string
  correct_answer?: string
  validation_status?: string
  note: string
}

const updates: Update[] = [
  { id: '053094de-dd73-4f22-a776-1a3ee41e0f3d', source_section: '14 CFR 61.23(d)', note: 'Verified against current eCFR duration table. No change.' },
  { id: '06c2e376-7f9f-4680-b500-b9005a71b9a2', source_section: '14 CFR 91.113(e)', note: 'Verified against current eCFR text. No change.' },
  {
    id: '0b96e991-5561-4097-9e94-edf9abecbe82', source_section: '14 CFR 61.19(c)(1)',
    reference: '14 CFR 61.19(c)(1)',
    note: 'Citation corrected: "student pilot certificate does not expire" is 61.19(c)(1) (pilot certificates generally). 61.19(b) is the OPPOSITE case -- pre-April-2016 paper student certificates, which DO expire on the medical-certificate-linked 60/24-month schedule.',
  },
  {
    id: '0e6a816a-e5fa-4dbe-a8b3-b7d5abc44d60', source_section: '14 CFR 91.113(c)-(d)',
    reference: '14 CFR 91.113(c)-(d)',
    explanation: 'Under the current 14 CFR 91.113(d), among converging aircraft of different categories a balloon has the right-of-way over any other aircraft, and a glider has the right-of-way over powered aircraft; an aircraft in distress has absolute right-of-way over all other air traffic under 91.113(c). Because a glider is unpowered, it has the right-of-way over all engine-driven aircraft, including helicopters and airships.',
    note: 'Regulatory change found: 91.113(d) was amended (Amdt. 91-381, eff. July 2025) and no longer lists a separate "powered parachute / weight-shift-control aircraft" tier -- the stored explanation described the pre-2025 5-tier hierarchy, which is now outdated, and cited (b) (the general vigilance paragraph) instead of (c)-(d). The tested answer (glider) is still correct under the current rule; explanation rewritten to match current text.',
  },
  { id: '10133100-291e-4b89-a624-571bc7ef4ea0', source_section: '14 CFR 91.113(g)', note: 'Verified against current eCFR text. No change.' },
  { id: '111160e3-833f-4edf-88b5-5d91d60ba237', source_section: '14 CFR 91.113(f)', note: 'Verified against current eCFR text. No change.' },
  { id: '1132b190-f87c-421a-a393-b4eab4796427', source_section: '14 CFR 61.23(d)', note: 'Verified against current eCFR duration table. No change.' },
  { id: '11710d8c-c7f1-4ddf-8a34-4d9deb2ea0bb', source_section: 'AIM 4-3-13 (Table 4-3-1)', note: 'Verified against live FAA AIM chapter 4-3-13 light-gun-signal table. No change.' },
  { id: '1294592b-c2b5-4f22-88e5-8412667fca99', source_section: '14 CFR 91.151(a)(1)', note: 'Verified against current eCFR text. No change.' },
  { id: '192e225d-0bf2-4e63-a052-63a643454b39', source_section: '49 CFR 830.5', note: 'Verified against current eCFR text. No change.' },
  { id: '1abe48c8-8ec6-42ce-9ccf-5b9e084d0f69', source_section: '14 CFR 91.159(a)(1)', note: 'Verified against current eCFR text. No change.' },
  { id: '1bd479bd-bc20-41c6-9c59-2a8751ff4ca0', source_section: '14 CFR 91.119(b)', note: 'Verified against current eCFR text. No change.' },
  { id: '1d6707f3-44c0-49ad-88d3-f2030fc00950', source_section: '14 CFR 91.109(c)', note: 'Verified against current eCFR text. No change.' },
  { id: '1dd4bb03-31c7-4189-adc7-8e9a69d20a60', source_section: 'AIM 4-1-20', note: 'Verified against live FAA AIM chapter 4-1-20 code-change guidance. No change.' },
  { id: '1eace60a-fb2f-47e6-bdee-0df10f883d41', source_section: '49 CFR 830.15(a)', note: 'Verified against current eCFR text. No change.' },
  { id: '1f5d5241-cf7c-4427-b49a-fc505b44b3e9', source_section: '14 CFR 91.125; AIM 4-3-13 (Table 4-3-1)', note: 'Verified against current eCFR text and live FAA AIM light-gun-signal table. No change.' },
  {
    id: '2558aa0d-acf1-4792-a447-453c352c9067', source_section: '14 CFR 61.57(b)(1)',
    correct_answer: 'B',
    reference: '14 CFR 61.57(b)(1)',
    explanation: '14 CFR 61.57(b)(1) requires that to act as PIC carrying passengers during the period beginning 1 hour after sunset and ending 1 hour before sunrise, a pilot must have made, within the preceding 90 days, at least 3 takeoffs and 3 full-stop landings during that SAME period -- 1 hour after sunset to 1 hour before sunrise -- not the broader sunset-to-sunrise definition of "night" used elsewhere (e.g., for position lights under 14 CFR 91.209).',
    note: 'CORRECT-ANSWER ERROR, confirmed against current eCFR text: 61.57(b)(1) uses the narrower "1 hour after sunset to 1 hour before sunrise" window for both the currency trigger and the qualifying landings, not "between sunset and sunrise." Changed correct_answer from A to B (which already existed as an option with that exact wording).',
  },
  {
    id: '26e2a14f-e94c-43c1-9734-b39f26f70226', source_section: '14 CFR 91.303',
    explanation: '14 CFR 91.303 prohibits aerobatic flight: over any congested area of a city, town, or settlement; over an open-air assembly of persons; within the lateral boundaries of Class B, C, D, or E surface areas; within 4 nautical miles of the centerline of any Federal airway; below 1,500 feet AGL; or when flight visibility is less than 3 statute miles. Answer C correctly reflects these limits.',
    note: 'Explanation self-contradiction fixed: it accurately described the 1,500 ft / 4 NM rule (which matches option C, the stored correct_answer) but then said "Answer A correctly reflects these limits." Corrected to "Answer C."',
  },
  {
    id: '278108b4-12d9-4d68-9cb1-768f1a00d7e2', source_section: '14 CFR 91.111(b)-(c)',
    option_a: 'When carrying passengers for hire -- this prohibition applies with no exception, even with prior arrangement between the pilots in command',
    reference: '14 CFR 91.111(c)',
    explanation: '14 CFR 91.111(c) unconditionally prohibits formation flight when carrying passengers for hire -- there is no exception for prior arrangement between pilots in command. (Prior arrangement between PICs is instead what 91.111(b) requires to conduct formation flight at all when NOT carrying passengers for hire.) No commercial-certificate requirement or ATC-authorization requirement exists under 91.111.',
    note: 'Content error: option A stated formation flight while carrying passengers for hire is permitted "unless a prior arrangement has been made" -- but 91.111(c) is an unconditional ban with no such exception; the "prior arrangement" clause in 91.111(b) governs a different (non-hire) case. Option A text and explanation corrected; correct_answer letter (A) unchanged.',
  },
  {
    id: '280ee573-1832-44d8-b1ec-2ca46bdb2e9d', source_section: '14 CFR 91.109',
    validation_status: 'rejected',
    explanation: 'REJECTED by content audit: this question references "a pilot with less than the required minimum safe airspeed" transferring control of an aircraft under simulated instrument conditions -- a concept that does not appear anywhere in 14 CFR 91.109 or elsewhere in Part 91. The scenario as written does not correspond to any real regulatory requirement and cannot be corrected without inventing new question content, which is out of scope for a source-verification pass.',
    note: 'Incoherent/unfixable as written -- likely a corrupted auto-generated question (garbled template substitution). Rejected rather than guessing at intended content.',
  },
  { id: '2cf81b0e-980c-4463-840b-0639f94ca2d0', source_section: '14 CFR 91.9; 14 CFR 91.203', note: 'Verified: ARROW documents (Airworthiness certificate, Registration, Operating limitations, Weight & balance) required for domestic ops; radio station license only for international. No change.' },
  { id: '2d99bacd-a842-4367-b752-259ab4feff63', source_section: '14 CFR 61.89(a)(4)', note: 'Verified against current eCFR text. No change.' },
  { id: '2e3ecacf-2e42-4d69-9d01-afe04da0344b', source_section: '14 CFR 91.109(c)(1)(i)', note: 'Verified against current eCFR text. No change.' },
  { id: '30b20ed0-6913-4c10-89ad-ff0413a27375', source_section: '14 CFR 91.107(a)(1)', note: 'Verified against current eCFR text. No change.' },
  { id: '32b2b434-3bd2-4a7d-b541-182ab3cdec11', source_section: '14 CFR 91.155(a) (table, Class G <=1,200 ft, day)', note: 'Verified against current eCFR table. No change.' },
  { id: '33bfd7af-5e05-4d6c-b160-e747195291ae', source_section: '14 CFR 91.113(f)', note: 'Verified against current eCFR text. No change.' },
  { id: '33e3edc0-c798-4dca-bfd2-834b8ecf8466', source_section: '49 CFR 830.2', note: 'Verified against current eCFR definition text. No change.' },
  { id: '3453193d-acb5-4be1-a767-d3a074b7f8bd', source_section: '14 CFR 61.89(a)(6)', note: 'Verified against current eCFR text. No change.' },
  {
    id: '353efcb0-863b-4e00-866e-4c9258f9713c', source_section: '14 CFR 61.93(c)(3)',
    reference: '14 CFR 61.93(c)(3)',
    note: 'Citation corrected: the per-flight endorsement content requirement (make/model, planning-correct statement, limitations-met statement) is 61.93(c)(3). 61.93(c)(1) is only the category-of-aircraft solo cross-country endorsement, a different, one-time endorsement. Answer content matches standard FAA sample endorsement practice (AC 61-65) and is left unchanged.',
  },
  { id: '3627610f-4dc6-470a-b350-1fc4e41f02f4', source_section: 'AIM 4-3-13 (Table 4-3-1)', note: 'Verified against live FAA AIM light-gun-signal table. No change.' },
  {
    id: '37a3515b-9ea4-4ce1-8576-f867a8bdc2d5', source_section: '14 CFR 91.155(a) (table)',
    explanation: "14 CFR 91.155's table specifies that in Class G airspace at or below 1,200 feet AGL during the day, the minimum flight visibility is 1 statute mile and the pilot must remain clear of clouds -- the most lenient VFR minimum in the table, reflecting uncontrolled Class G airspace. Option B (3 SM, 500 ft below / 1,000 ft above / 2,000 ft horizontal) describes the Class E (below 10,000 ft MSL) minimums. Option A's 3 SM / clear-of-clouds combination does not correspond to any class in the table below 10,000 ft MSL.",
    note: 'Explanation was internally backwards: it said option C (the stored correct answer) "describes the minimums for Class E," when C is actually the Class G day minimum being tested, and mischaracterized option A. Rewritten to correctly describe what each distractor represents.',
  },
  { id: '3a1dcb4c-dc98-48c0-ab63-d62b0e0fabea', source_section: '14 CFR 61.23(d) (table, first-class medical used for private-pilot privileges)', note: 'Verified against current eCFR duration table -- matches precisely, including the 60/24-month figures for a first-class medical exercising private pilot privileges. No change.' },
  { id: '3b7f8712-1a7e-417f-a290-b7b27aa00eb3', source_section: '14 CFR 91.103(a)', note: 'Verified against current eCFR text. No change.' },
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
    const logEntry = `[content-audit 2026-09-15 batch2] ${u.note}`
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
    if (u.option_a) patch.option_a = u.option_a
    if (u.correct_answer) patch.correct_answer = u.correct_answer
    if (u.validation_status) patch.validation_status = u.validation_status

    const { error } = await supabase.from('questions').update(patch).eq('id', u.id)
    if (error) throw error
    ok++
  }
  const changed = updates.filter(u => u.reference || u.explanation || u.option_a || u.correct_answer || u.validation_status).length
  console.log(`Batch 2 complete: ${ok}/${updates.length} questions updated (source_title/source_section/verified_at/verified_by set on all; ${changed} had a content/citation correction applied; 1 rejected; 1 correct_answer changed).`)
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
