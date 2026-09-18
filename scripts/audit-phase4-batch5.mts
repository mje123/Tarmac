/**
 * Phase 4 -- Batch 5: substantive FAA-source verification.
 *
 * Category: "Regulations" (PPL), next 33 unverified questions by id.
 * Every question independently checked against current eCFR text (14 CFR
 * Part 61/91, 49 CFR Part 830) or the live FAA AIM HTML page.
 *
 * Disposition:
 *   - 22 questions: correct as-is. No content change. Marked verified.
 *   - 11 required a citation, explanation, or answer-text fix. No full
 *     correct_answer swap was needed this batch, but two fixes correct
 *     fabricated regulatory nuances rather than mere pinpoint citations:
 *     - a2246b60: the marked answer ("towing a glider as part of a
 *       search-and-rescue operation") conflated two unrelated real
 *       provisions -- 61.113(e) (SAR expense reimbursement, nothing to
 *       do with towing) and 61.113(g) (glider towing, nothing to do with
 *       SAR). Rewritten to state the real, standalone 61.113(g) privilege.
 *       The explanation also falsely claimed aircraft-demo flights
 *       (option C) require a commercial certificate -- 61.113(f)
 *       explicitly permits a PRIVATE pilot who is an aircraft salesman
 *       with 200+ hours to do this. Corrected.
 *     - b0f61e86: option A added a fabricated qualifier ("which was not
 *       caused by illness diagnosed before the flight") not present in
 *       49 CFR 830.5(a)(2), which covers ANY inability of a required
 *       crewmember to perform duties from injury or illness, with no
 *       carve-out for pre-existing conditions. Removed the fabricated
 *       qualifier; fixed the citation (was pointing at (a)(3), turbine
 *       engine failure, an unrelated item).
 *   - The other 9: wrong CFR pinpoint citations (91.113(e) vs (d) for
 *     converging aircraft, 91.113(b) vs (c)-(d), 61.23(d)(2) [second-
 *     class row] cited for a third-class scenario, 91.103(b) vs (a)),
 *     three dangling "Answer A/C" explanation references that named the
 *     wrong option letter for the stored correct_answer, an option-B
 *     "never" overgeneralization (61.113 has narrow compensation
 *     exceptions), a citation broadened to note 91.129 only covers Class
 *     D specifically (Class B/C towered fields have their own, similarly
 *     unconditional, comm-requirement sections), and one question
 *     (9ed8612f) flagged in its explanation as having two technically
 *     defensible options without a "both" choice available -- left the
 *     correct_answer as the least-ambiguous of the two.
 *
 * Run: npx tsx scripts/audit-phase4-batch5.mts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const VERIFIED_BY = 'content-audit-2026-09-batch5'
const now = new Date().toISOString()

interface Update {
  id: string
  source_section: string
  reference?: string
  explanation?: string
  option_a?: string
  option_b?: string
  note: string
}

const updates: Update[] = [
  { id: '99a6411e-4317-4841-84b0-eb060fc32cfd', source_section: '49 CFR 830.2', note: 'Verified against the full current "serious injury" definition text. No change.' },
  { id: '9a717bc7-b7ed-46a2-a62d-186703c30ace', source_section: '14 CFR 91.205(b)', note: 'Verified against current eCFR text (the A-TOMATO-FLAMES VFR-day equipment list). No change.' },
  {
    id: '9afc5875-ffef-4bf3-bcff-4de706d6d851', source_section: '14 CFR 91.113(d)',
    reference: '14 CFR 91.113(d)',
    note: 'Citation corrected: the converging-aircraft right-of-way rule is 91.113(d) ("Converging"). (e) is the head-on rule, a different clause. Answer content (you give way to traffic on your right) already correct and unchanged.',
  },
  {
    id: '9ed8612f-dcce-47fa-884a-1df4bf6a621b', source_section: '49 CFR 830.5(a)(1); 830.5',
    explanation: '49 CFR 830.5 requires immediate NTSB notification for an aircraft accident (which always includes substantial damage, as in option B) or for any of a list of serious incidents, including flight control system malfunction OR FAILURE (830.5(a)(1), which textually covers option A too). Between the two, B is the least ambiguous choice: an accident with substantial damage unconditionally triggers immediate notification, while whether a given control-system anomaly rises to a reportable "malfunction or failure" can occasionally require judgment. Option C (a single unscheduled engine shutdown) is not one of the enumerated 830.5 triggers.',
    note: 'The three-option format doesn\'t include a "both" choice, but option A (flight control malfunction) textually also matches a real 830.5(a)(1) trigger, not just B. Left correct_answer as B (the safest, least disputable answer) and rewrote the explanation to acknowledge A is also technically covered rather than implying it categorically is not.',
  },
  { id: 'a09bd3fb-090b-4be0-b8ef-7afb5aa54b35', source_section: '14 CFR 91.7(b)', note: 'Verified against current eCFR text. No change.' },
  {
    id: 'a2246b60-cae2-4a94-bce2-45e32e3603c7', source_section: '14 CFR 61.113(g)',
    option_b: 'Towing a glider or unpowered ultralight vehicle, provided the pilot meets the currency requirements of 14 CFR 61.69',
    reference: '14 CFR 61.113(g)',
    explanation: '14 CFR 61.113(g) permits a private pilot who meets the towing-currency requirements of 61.69 to act as PIC of an aircraft towing a glider or unpowered ultralight vehicle -- a standalone privilege, not conditioned on a search-and-rescue mission (that is a separate, unrelated exception in 61.113(e), which only covers expense reimbursement for SAR flights, not towing). Chartering a flight for a business associate\'s meeting where the pilot has no personal interest in attending (option A) is not one of the compensation exceptions in 61.113(b)-(h). Note that demonstrating an aircraft to a prospective buyer (option C) is ALSO a real, narrower exception under 61.113(f) -- but only for a private pilot who is an aircraft salesman with at least 200 hours of logged flight time, a qualifier this option omits; it does NOT require a commercial certificate.',
    note: 'The marked answer conflated two unrelated real provisions: 61.113(e) (SAR expense reimbursement, unrelated to towing) and 61.113(g) (glider towing, unrelated to SAR). Rewrote option B to state the real, standalone 61.113(g) privilege. Also corrected a false claim in the explanation that option C requires a commercial certificate -- 61.113(f) explicitly permits a private pilot (aircraft salesman, 200+ hours) to do this.',
  },
  {
    id: 'a35e53db-bd9c-4ad3-b6c1-af62b2ee5e94', source_section: '14 CFR 91.209(b)',
    explanation: "14 CFR 91.209(b) requires an aircraft equipped with an anti-collision light system to have those lights lit whenever operated, day or night, except that the PIC may turn them off when doing so is in the interest of safety given operating conditions. Making A the best answer.",
    note: 'Explanation had a dangling, contradictory reference ("making C the best answer") when the stored correct_answer is A and option C\'s text ("sunset to sunrise only") is not what 91.209(b) says. Verified the real anti-collision-light rule has no day/night qualifier; corrected the dangling reference.',
  },
  { id: 'a52b4fc9-f2c7-4542-a7e7-94d512434518', source_section: '14 CFR 61.23(a)(3)(i)', note: 'Verified against current eCFR text. No change.' },
  { id: 'a5a022ec-d187-42f5-9473-6cdd2fb3fe83', source_section: '14 CFR 61.56(c)', note: 'Verified against current eCFR text. No change.' },
  { id: 'a5bb0da0-2ac2-4065-b694-6034d326bd3b', source_section: '14 CFR 91.151(a)(2)', note: 'Verified against current eCFR text. No change.' },
  {
    id: 'a636f43f-53ac-4399-a7fa-5e421130084c', source_section: '14 CFR 61.113(c)',
    explanation: 'Under 14 CFR 61.113(c), a private pilot may share the operating expenses of a flight with passengers -- limited to fuel, oil, airport expenditures, or rental fees -- provided the pilot pays no less than the pro rata share. The pilot may not accept compensation for acting as PIC except as specifically permitted elsewhere in 61.113. Answer B is the best choice, though technically expenses are shared pro rata rather than necessarily "equally."',
    note: 'Explanation had a dangling reference to "Answer A" (which is actually the wrong, "charge a fee" option) when the stored correct_answer is B. Corrected to "Answer B," matching the rest of the explanation\'s own reasoning.',
  },
  { id: 'a799c9fc-5b40-4a51-8191-b226537a4497', source_section: '14 CFR 91.409(b)', note: 'Verified against current eCFR text -- confirmed the 100-hour overrun is added against the NEXT interval (excess time "must be included in computing the next 100 hours"), matching the 3302.5 + 100 = 3402.5 calculation exactly. No change.' },
  { id: 'a799e312-a214-4d2c-b9dd-afdc1b63451c', source_section: '14 CFR 61.93(c)', note: 'Verified against current eCFR text. No change.' },
  { id: 'adc022b6-1444-4646-96d8-c43583efbeef', source_section: '14 CFR 91.7(b)', note: 'Verified against current eCFR text. No change.' },
  {
    id: 'adf00d7e-0dab-41eb-afd0-45bf1a807d20', source_section: '14 CFR 61.113(a)-(h)',
    option_b: 'No, because ferrying an aircraft to a maintenance facility for compensation is not among the specific compensation exceptions listed in 14 CFR 61.113(b) through (h)',
    explanation: '14 CFR 61.113(a) prohibits a private pilot from acting as PIC of an aircraft for compensation or hire. Paragraphs (b) through (h) list narrow, specific exceptions (incidental-to-business flights, pro rata expense sharing, charitable flights, SAR expense reimbursement, aircraft-salesman demonstrations, glider towing, and light-sport production flight testing) -- flying an aircraft to a maintenance facility for pay is not among them, so it remains prohibited. A commercial certificate would resolve this by removing the compensation restriction entirely.',
    note: 'Option B\'s original text ("a private pilot may never receive compensation for flying") overstated the rule -- 61.113(b)-(h) lists several real, narrow exceptions where a private pilot CAN receive compensation. The specific scenario in this question is still correctly illegal, but for a narrower, more accurate reason. Rewrote option B and the explanation; correct_answer (B) unchanged.',
  },
  { id: 'aeff4895-7ac0-421d-98cd-06f1550c5a63', source_section: '14 CFR 91.113(d)', note: 'Verified against current eCFR text -- citation already correct on this row. No change.' },
  { id: 'af3a1737-8510-42fc-a05b-979504270e4c', source_section: '14 CFR 61.19(c)(1)', note: 'Verified against current eCFR text (pilot certificates are issued without an expiration date). No change.' },
  {
    id: 'b0f61e86-47f0-4092-888c-c9750ec63863', source_section: '49 CFR 830.5(a)(2)',
    option_a: 'Incapacitation of a required flight crewmember, from injury or illness, that prevents them from performing normal flight duties',
    reference: '49 CFR 830.5(a)(2)',
    explanation: "49 CFR 830.5(a)(2) requires immediate NTSB notification for the inability of any REQUIRED flight crewmember to perform normal flight duties as a result of injury or illness -- with no exception or carve-out for whether the illness was known or diagnosed before the flight. Option B is close but omits the \"required crewmember\" qualifier; option C incorrectly narrows the trigger to incapacitation causing loss of control that requires ATC assistance, which is not part of the regulatory text.",
    note: 'Option A had a fabricated qualifier ("which was not caused by illness diagnosed before the flight") not present anywhere in 830.5(a)(2) -- confirmed against the full current text, which covers ANY injury-or-illness-based inability of a required crewmember, with no pre-existing-condition carve-out. Removed the fabricated qualifier and corrected the citation (was pointing at (a)(3), turbine engine component failure, an unrelated item).',
  },
  {
    id: 'b19657c1-d80e-4db8-9e67-dbd04e88f4b6', source_section: '14 CFR 91.113(c)-(d)',
    reference: '14 CFR 91.113(c)-(d)',
    note: 'Citation corrected (same recurring issue as Batch 2/4): the right-of-way hierarchy is in 91.113(c)-(d), not (b) (the general vigilance/see-and-avoid paragraph). Answer content (balloon at the top of the hierarchy) already correct and unchanged.',
  },
  { id: 'b1ed069b-68e0-4a52-907d-b5a1b5959f26', source_section: 'FAA-H-8083-25 Ch. 17', note: 'Verified -- standard aeromedical fact (hyperventilation treatment restores CO2 levels). No change.' },
  {
    id: 'b26f5309-4aa6-4132-b62e-b18e4d32970b', source_section: '14 CFR 91.129(c); 91.130; 91.131',
    reference: '14 CFR 91.129(c); 91.130(c); 91.131(a)',
    note: 'Citation broadened: 91.129 by itself only covers Class D airspace specifically (confirmed via its title, "Operations in Class D airspace," and its unconditional two-way-radio requirement in (c)). The same unconditional communications principle applies at Class B (91.131) and Class C (91.130) towered airports too, which the question\'s "all towered airports" framing implicitly relies on. Answer content unchanged.',
  },
  { id: 'b31639e6-f6e4-44f1-8ef1-81bd6a64ee42', source_section: '14 CFR 91.117(a)', note: 'Verified against current eCFR text. No change.' },
  {
    id: 'b5456ce6-b8ed-41c0-a388-fc8198a537ad', source_section: '14 CFR 91.103(a)',
    reference: '14 CFR 91.103(a)',
    explanation: 'Under 14 CFR 91.103, before beginning a flight, the pilot in command must become familiar with all available information concerning that flight. For flights not in the vicinity of an airport, 91.103(a) specifically requires weather reports and forecasts, fuel requirements, alternatives available if the planned flight cannot be completed, and any known ATC delays. NOTAMs and TFRs are best practices, but the specific regulatory language for this scenario is captured in option B.',
    note: 'Citation corrected: the tested content (weather/fuel/alternatives/traffic delays for a flight not in the vicinity of an airport) is 91.103(a), not (b) (which covers runway-length/performance data for ANY flight, a different item). Also fixed a dangling "option A" reference in the explanation when the stored correct_answer is B.',
  },
  { id: 'b5e951e6-f686-4798-8ffe-8b279d5f5331', source_section: '14 CFR 91.409(a)(1)', note: 'Verified against current eCFR text. No change.' },
  { id: 'b6a1c523-4a84-4282-85ae-f6d824b1dca6', source_section: '14 CFR 91.413(a)', note: 'Verified against current eCFR text (24-calendar-month convention). No change.' },
  { id: 'ba759dc2-c2a7-4d6d-8c5c-97ee8fb0b443', source_section: '14 CFR 61.51(b)', note: 'Verified against current eCFR text. No change.' },
  { id: 'baba8676-beaf-4a77-a2b2-9f5ddc56a8d0', source_section: 'AIM 8-1-6', note: 'Verified against live FAA AIM chapter 8-1-6 "Vision in Flight" -- matches essentially verbatim. No change.' },
  { id: 'bd37e48b-9255-48ac-ae68-55862848cec8', source_section: '14 CFR 61.3(e)', note: 'Verified against current eCFR text -- matches essentially verbatim, including the correct pinpoint citation already on the row. No change.' },
  { id: 'bd567215-c54d-4bd3-a0c8-d60f1bd178a3', source_section: 'AIM 6-3-1', note: 'Verified against live FAA AIM chapter 6-3-1 emergency-frequency guidance. No change.' },
  { id: 'bdc104d0-e3ba-4630-bca9-18d72c73ec75', source_section: '14 CFR 91.209', note: 'Verified: standard position-light convention (red left wingtip, green right wingtip, white tail). No change.' },
  {
    id: 'bf203686-2cb9-44cf-a06a-6c86b18582d7', source_section: '14 CFR 61.23(d)(3)(ii)',
    reference: '14 CFR 61.23(d)(3)(ii)',
    note: 'Citation corrected: the stored reference, 61.23(d)(2), is actually the SECOND-class medical duration row. The correct row for a THIRD-class medical held by a pilot 40 or older is (d)(3)(ii), confirmed against the current duration table. Answer content (June 30, 2023) already correct and unchanged.',
  },
  { id: 'bfc5814a-080e-4e95-b8ae-76c88561edc7', source_section: '14 CFR 61.56(c)', note: 'Verified against current eCFR text (calendar-month convention). No change.' },
  { id: 'c45a388d-1d01-4ca4-9d27-98409aa3445c', source_section: '14 CFR 61.89(a)(6); 91.155(a)', note: 'Verified against current eCFR text (4 SM exceeds both the Class E 3 SM minimum and the student\'s 3 SM day floor). No change.' },
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
    const logEntry = `[content-audit 2026-09-18 batch5] ${u.note}`
    const newLog = priorLog ? `${priorLog}\n${logEntry}` : logEntry

    const patch: Record<string, unknown> = {
      source_title: u.source_section.startsWith('AIM') ? 'FAA Aeronautical Information Manual (current)' : (u.source_section.startsWith('FAA-H') ? 'FAA-H-8083-25 (Pilot\'s Handbook of Aeronautical Knowledge)' : 'eCFR (current)'),
      source_section: u.source_section,
      verified_at: now,
      verified_by: VERIFIED_BY,
      validation_log: newLog,
    }
    if (u.reference) patch.reference = u.reference
    if (u.explanation) patch.explanation = u.explanation
    if (u.option_a) patch.option_a = u.option_a
    if (u.option_b) patch.option_b = u.option_b

    const { error } = await supabase.from('questions').update(patch).eq('id', u.id)
    if (error) throw error
    ok++
  }
  const changed = updates.filter(u => u.reference || u.explanation || u.option_a || u.option_b).length
  console.log(`Batch 5 complete: ${ok}/${updates.length} questions updated (source_title/source_section/verified_at/verified_by set on all; ${changed} had a content/citation correction applied; 0 correct_answer changes).`)
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
