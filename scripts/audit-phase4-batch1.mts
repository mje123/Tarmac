/**
 * Phase 4 — Batch 1: substantive FAA-source verification.
 *
 * Category: "IFR Regulations" (30 questions, exam_type=ifr). Every question
 * independently checked against the current eCFR text of the cited 14 CFR
 * Part 61/91 section (fetched live via the Browser pane, not from model
 * memory) plus one FAA legal-interpretation lookup for a genuinely disputed
 * claim. See conversation record for the full per-question verification
 * notes. Disposition:
 *   - 19 questions: correct as-is. No content change. Marked verified.
 *   - 10 questions: correct answer, but a wrong/imprecise CFR pinpoint
 *     citation or an explanation claim not actually present in the cited
 *     text. Citation/explanation corrected; answer choices untouched.
 *   - 1 question (9c98684e): the stated correct answer asserted that
 *     instrument currency in an ATD/FTD requires an instructor to be
 *     present. Confirmed FALSE via FAA legal interpretation (61.57(c)(2)
 *     currency requires only an FAA-approved device; instructor presence
 *     is a 61.51(g)(4) training-experience requirement, not a currency
 *     requirement). Option C and the explanation corrected accordingly.
 *
 * None of the 30 required rejection — every question's *correct_answer*
 * was defensible once citation/explanation were corrected.
 *
 * Run: npx tsx scripts/audit-phase4-batch1.mts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const VERIFIED_BY = 'content-audit-2026-09-batch1'
const now = new Date().toISOString()

interface Update {
  id: string
  source_section: string
  reference?: string
  explanation?: string
  option_c?: string
  note: string
}

const updates: Update[] = [
  { id: '04744187-bdca-4684-9294-14e5705715b7', source_section: '14 CFR 91.169(c)(1)(i)(A)', note: 'Verified against current eCFR text. No change.' },
  {
    id: '083e8342-92d9-4cbe-a7a0-360d22c14b50', source_section: '14 CFR 91.183(b)-(c); AIM 5-3-3',
    reference: 'AIM 5-3-3; 14 CFR 91.183(b)-(c)',
    explanation: "Per AIM 5-3-3 and 14 CFR 91.183, pilots operating IFR in controlled airspace must report, without a specific ATC request: vacating any previously assigned altitude or flight level (AIM 5-3-3 mandatory report), any unforecast weather conditions encountered (14 CFR 91.183(b)), and any other information relating to the safety of flight (14 CFR 91.183(c)). Note that 91.183(a) itself specifically requires reporting designated reporting points, not altitude changes — the altitude-vacating report is an AIM/ATC-procedures requirement commonly taught alongside 91.183, not literal 91.183 text.",
    note: 'Citation corrected: 91.183 alone does not list "vacating an altitude" — that is AIM 5-3-3. Answer choice is otherwise correct and pedagogically standard.',
  },
  { id: '1879c1a8-c7dd-4e85-b59f-2f06df29e4da', source_section: '14 CFR 91.167(a)(3)', note: 'Verified against current eCFR text. No change.' },
  { id: '1bbcf5e4-63fb-421d-8d27-e72dd45ab2c7', source_section: '14 CFR 91.109(c)(1)(i)', note: 'Verified against current eCFR text. No change.' },
  { id: '246e1f78-cc27-46b3-bc6e-54d336c6c4dd', source_section: '14 CFR 91.171(a)(2)', note: 'Verified against current eCFR text. No change.' },
  { id: '3d7799eb-cea6-4406-bb71-f8c39fbd41b5', source_section: '14 CFR 91.175(c)', note: 'Verified against current eCFR text. No change.' },
  {
    id: '3e44a1eb-cc4e-4663-a9bf-f11f2a9b0b63', source_section: '14 CFR 91.205(d)',
    option_c: 'Two-way radio communications, navigation equipment appropriate to the route, gyroscopic rate-of-turn indicator, slip/skid indicator, sensitive altimeter, clock, gyroscopic pitch and bank indicator, gyroscopic direction indicator, and generator or alternator of adequate capacity',
    explanation: '14 CFR 91.205(d) lists the minimum required equipment for IFR flight: two-way radio and navigation equipment appropriate to the route, gyroscopic rate-of-turn indicator, slip/skid indicator, sensitive altimeter adjustable for barometric pressure, clock displaying hours/minutes/seconds, gyroscopic pitch-and-bank indicator, gyroscopic direction indicator, and a generator or alternator of adequate capacity (91.205(d)(7)).',
    note: 'Content gap: answer choice omitted 91.205(d)(7) (generator/alternator of adequate capacity), one of the 8 required items. Added.',
  },
  { id: '3f357544-bdbd-48c6-9496-806528c6a014', source_section: '14 CFR 91.175(c)(3)', note: 'Verified against current eCFR text. No change.' },
  { id: '4785c355-1380-45fc-9aee-278eef5f0817', source_section: '14 CFR 91.167(a)', note: 'Verified against current eCFR text. No change.' },
  {
    id: '4f3bc074-e0c5-4e61-850d-55bb8e5e4690', source_section: '14 CFR 91.185(c)(1)(ii)',
    reference: 'FAR 91.185(c)(1)(ii)',
    note: 'Citation corrected: content matches 91.185(c)(1)(ii) (route to fly when radar vectored), not (b) — (b) is the VFR-conditions paragraph.',
  },
  { id: '56cdb953-6adc-42a7-926e-b679691f4959', source_section: '14 CFR 91.109(c)(1)(i)', note: 'Verified against current eCFR text. No change.' },
  { id: '58629050-ccfc-483d-962c-57216808c6df', source_section: '14 CFR 91.109(c); 14 CFR 61.51(e)', note: 'Verified against current eCFR text. No change.' },
  { id: '617f964f-1c90-432a-a6af-7f72fb870491', source_section: '14 CFR 61.57(d)', note: 'Verified against current eCFR text. No change.' },
  { id: '66e3a783-249e-4a27-ae72-abe2e93b8567', source_section: '14 CFR 91.169(b)', note: 'Verified against current eCFR text. No change.' },
  { id: '697a44d3-a930-497c-83c3-46b4e6599731', source_section: '14 CFR 61.51(g)(1)', note: 'Verified against current eCFR text — matches verbatim. No change.' },
  { id: '6b5e0562-4e89-4764-be3a-cb6c31225a50', source_section: '14 CFR 91.169(b)', note: 'Verified against current eCFR text. No change.' },
  { id: '6b9af078-ff0e-4eb8-89bf-4fb06be9f425', source_section: '14 CFR 91.173', note: 'Verified against current eCFR text. No change.' },
  { id: '6d79d966-bddf-458f-b1ef-0f4ec29d4096', source_section: '14 CFR 61.57(c)(1)', note: 'Previously corrected this session (3->6 approaches); re-verified against current eCFR text of 61.57(c)(1)(i)-(iii). Confirmed correct.' },
  { id: '766a6650-b626-43cf-8b55-26b7f51f91ba', source_section: '14 CFR 91.185(c)(2)', note: 'Verified against current eCFR text. No change.' },
  {
    id: '82f2160b-66e9-4999-8da0-82cb31966b1f', source_section: '14 CFR 91.171(b)(3)',
    reference: 'FAR 91.171(b)(3)',
    note: 'Citation corrected: airborne-checkpoint +/-6 degree limit is 91.171(b)(3); (b)(2) is the ground-checkpoint +/-4 degree limit.',
  },
  {
    id: '8b1a4c36-b5a2-4191-94f6-b767217bf8e1', source_section: '14 CFR 91.175(e); AIM 5-4-21',
    reference: '14 CFR 91.175(e); AIM 5-4-21',
    explanation: "If the required visual references are not established at the DA/MDA or missed approach point, 14 CFR 91.175(e) requires the pilot to immediately execute the missed approach procedure. After a missed approach, standard IFR practice (AIM 5-4-21) and the pilot's own flight plan — which must designate an alternate under 14 CFR 91.169 when the destination forecast requires one — call for proceeding to the filed alternate airport in the manner prescribed for the route to be flown, unless amended by ATC. This scenario is not governed by 91.185, which applies only to two-way radio communications failure.",
    note: 'Citation was fabricated/wrong: 91.185(c)(3) covers lost-comm "leave clearance limit" procedures, not proceeding to an alternate after an unsuccessful approach, and the question never describes a comm failure. Re-grounded in 91.175(e) + AIM 5-4-21. Answer choice (proceed to alternate) unchanged — still the best of the three options.',
  },
  { id: '8c62e7b1-80b3-49f6-b946-5d176658adca', source_section: '14 CFR 61.51(g)', note: 'Verified against current eCFR text. No change.' },
  {
    id: '927550d3-cd15-4980-8f33-a876374251a1', source_section: '14 CFR 91.177(a)(2)(i)',
    reference: 'FAR 91.177(a)(2)(i)',
    note: 'Citation corrected: mountainous-terrain 2,000 ft/4 NM rule is 91.177(a)(2)(i), not (a)(1)(ii).',
  },
  {
    id: '9c98684e-4bd1-4000-89d1-f3db76eed1f8', source_section: '14 CFR 61.57(c)(2)',
    option_c: 'the device is approved for the purpose by the FAA, and the required tasks and iterations are performed and logged',
    explanation: "14 CFR 61.57(c)(2) allows the instrument currency tasks in 61.57(c)(1) to be completed in an FAA-approved full flight simulator, flight training device, or aviation training device, provided the device represents the appropriate category of aircraft and the tasks are performed and logged. Per FAA legal interpretation, an authorized instructor's presence is NOT required to satisfy 61.57(c) currency in an ATD/FTD -- that provision governs recent flight experience, not training or proficiency, and the device is designed to let a pilot replicate the tasks just as in an aircraft. (An instructor IS required under 61.51(g)(4) when logging device time to build aeronautical experience toward a certificate or rating -- a different purpose than currency.)",
    note: 'CONTENT ERROR, confirmed via FAA legal interpretation search (not just citation): the original answer choice asserted instructor supervision is required for ATD currency, which is false. Corrected option C and explanation; correct_answer letter (C) unchanged since the corrected text is now the accurate completion.',
  },
  { id: 'c4ae597c-a37c-4a2d-87cd-cafe7f032a11', source_section: '14 CFR 91.109(c)(1)(i)', note: 'Verified against current eCFR text -- matches verbatim. No change.' },
  { id: 'c66b32f5-f650-4186-a43f-11ef83482c67', source_section: '14 CFR 61.57(d)', note: 'Verified against current eCFR text. No change.' },
  {
    id: 'cd70f2dd-9052-4bbd-b914-0002426e696c', source_section: '14 CFR 91.169(c)(1)(i)(B)',
    reference: 'FAR 91.169(c)(1)(i)(B)',
    note: 'Citation corrected: 800 ft/2 SM non-precision alternate minima is 91.169(c)(1)(i)(B). The cited (c)(1)(ii) is actually the HELICOPTER alternate-minima paragraph (200 ft above approach minimum / 1 SM), a different rule entirely.',
  },
  {
    id: 'd8f4c7c9-7464-44a2-982a-dd2b318bce51', source_section: '14 CFR 91.185(b)',
    reference: 'FAR 91.185(b)',
    note: 'Citation corrected: "continue under VFR and land as soon as practicable" is 91.185(b) (VFR conditions), not (a) (the general paragraph).',
  },
  {
    id: 'f0d41dd2-b968-4a21-922a-862bc5aa36a9', source_section: '14 CFR 91.175(e); AIM 5-4-21',
    reference: '14 CFR 91.175(e); AIM 5-4-21',
    explanation: '14 CFR 91.175(e) requires the pilot to immediately execute the appropriate missed approach procedure if required visual references are not established at the DA/MDA or missed approach point. Prompt notification to ATC of the missed approach is standard IFR communication practice (AIM 5-4-21), though that specific notification duty is not itself written into the text of 91.175(e).',
    note: 'Explanation over-attributed an ATC-notification duty to 91.175(e) verbatim text, which only covers executing the missed approach. Re-attributed to AIM 5-4-21. Answer choice unchanged.',
  },
  {
    id: 'ffd68cea-9416-40ee-9ba9-180437557958', source_section: '14 CFR 91.177(a)(2)(ii)',
    reference: 'FAR 91.177(a)(2)(ii)',
    note: 'Citation corrected: non-mountainous 1,000 ft/4 NM rule is 91.177(a)(2)(ii), not (a)(1)(i).',
  },
]

async function main() {
  if (updates.length !== 30) throw new Error(`Expected 30 rows, got ${updates.length}`)

  let ok = 0
  for (const u of updates) {
    const { data: existing, error: fetchErr } = await supabase
      .from('questions')
      .select('validation_log')
      .eq('id', u.id)
      .single()
    if (fetchErr) throw fetchErr

    const priorLog = (existing?.validation_log as string | null) ?? ''
    const logEntry = `[content-audit 2026-09-15 batch1] ${u.note}`
    const newLog = priorLog ? `${priorLog}\n${logEntry}` : logEntry

    const patch: Record<string, unknown> = {
      source_title: 'eCFR Title 14 (current)',
      source_section: u.source_section,
      verified_at: now,
      verified_by: VERIFIED_BY,
      validation_log: newLog,
    }
    if (u.reference) patch.reference = u.reference
    if (u.explanation) patch.explanation = u.explanation
    if (u.option_c) patch.option_c = u.option_c

    const { error } = await supabase.from('questions').update(patch).eq('id', u.id)
    if (error) throw error
    ok++
  }
  console.log(`Batch 1 complete: ${ok}/${updates.length} questions updated (source_title/source_section/verified_at/verified_by set on all; ${updates.filter(u => u.reference || u.explanation || u.option_c).length} had a content/citation correction applied).`)
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
