/**
 * Phase 4 -- Batch 6: substantive FAA-source verification.
 *
 * Category: "Regulations" (PPL), next 33 unverified questions by id.
 * Every question independently checked against current eCFR text (14 CFR
 * Part 61/91, 49 CFR Part 830).
 *
 * This batch runs unusually clean: many rows duplicate facts already
 * verified in Batches 1-5 (safety pilot certificate minimums, VFR fuel
 * reserves, cloud clearances, right-of-way, medical durations) -- itself
 * a useful confirmation of the near-duplicate clustering already
 * reported in the Phase 2/3 deterministic audit.
 *
 * Disposition:
 *   - 29 questions: correct as-is. No content change. Marked verified.
 *   - 4 wrong CFR pinpoint citations:
 *     - c96941f0: distress right-of-way is 91.113(c), not (b).
 *     - cc81c446: the 91.103 not-in-vicinity-of-airport info list is
 *       paragraph (a), not (b) (a recurring mix-up across this category).
 *     - daeeca13: night VFR fuel reserve (45 min) is 91.151(a)(2). The
 *       stored (b) is actually the ROTORCRAFT fuel-reserve paragraph (20
 *       minutes) -- a completely different rule, confirmed against the
 *       full current 91.151 text.
 *     - ea0e69f4: the logbook-endorsement-before-practical-test mechanism
 *       is 61.39(a)(6) ("an endorsement... signed by an authorized
 *       instructor who certifies the applicant is prepared for the
 *       practical test"), not 61.107(a) (which only lists the required
 *       training AREAS OF OPERATION, not the endorsement requirement
 *       itself).
 *
 * Run: npx tsx scripts/audit-phase4-batch6.mts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const VERIFIED_BY = 'content-audit-2026-09-batch6'
const now = new Date().toISOString()

interface Update {
  id: string
  source_section: string
  reference?: string
  explanation?: string
  note: string
}

const updates: Update[] = [
  { id: 'c57242ba-c7d7-44a3-a672-5157d3708133', source_section: '14 CFR 91.109(c)(1)(i)', note: 'Verified against current eCFR text. No change.' },
  { id: 'c57740ff-443f-4751-886e-553397c14015', source_section: '14 CFR 91.155(a) (table)', note: 'Verified against current eCFR table. No change.' },
  { id: 'c763ffc4-28be-45c3-bef3-588477b75541', source_section: '14 CFR 61.23(d)(3)(i)', note: 'Verified against current eCFR duration table. No change.' },
  { id: 'c803e660-8b6c-48fb-927d-144c029360c6', source_section: '49 CFR 830.5(a)(4)', note: 'Verified against current eCFR text. No change.' },
  {
    id: 'c96941f0-b90c-44fe-a84d-6b0928ceaac3', source_section: '14 CFR 91.113(c)',
    reference: '14 CFR 91.113(c)',
    note: 'Citation corrected: "aircraft in distress has right-of-way over all other air traffic" is 91.113(c). (b) is the general vigilance/see-and-avoid paragraph, a different clause. Answer content already correct and unchanged.',
  },
  { id: 'ca4dcf87-15f5-4380-9c4a-765afabd6826', source_section: '14 CFR 61.56(d)(1)', note: 'Verified against current eCFR text. No change.' },
  { id: 'cab44bbf-30fe-4e41-9a55-7268fb627509', source_section: '14 CFR 91.151(a)(1)', note: 'Verified against current eCFR text -- the specific distance/speed figures given in the stem are immaterial; the day VFR reserve is a flat 30 minutes regardless. No change.' },
  { id: 'cc4f2d03-a8f6-423d-acb2-20ae965d9788', source_section: '14 CFR 61.23(d)(3)(i)', note: 'Verified against current eCFR duration table. No change.' },
  {
    id: 'cc81c446-9da2-4502-bfe3-7dc5db83ac30', source_section: '14 CFR 91.103(a)',
    reference: '14 CFR 91.103(a)',
    note: 'Citation corrected (recurring mix-up in this category): the not-in-vicinity-of-airport information list (fuel, alternatives, ATC delays) is 91.103(a). (b) is the runway-length/performance-data requirement that applies to ANY flight, a different paragraph. Answer content already correct and unchanged.',
  },
  { id: 'cd9f60fe-5cdd-4898-bf95-a3d43beca30e', source_section: '14 CFR 91.109(c)(1)(i)', note: 'Verified against current eCFR text. No change.' },
  { id: 'd17678de-140b-4944-9178-c0bc4fe3b387', source_section: '49 CFR 830.2', note: 'Verified against current eCFR text (serious-injury definition includes hospitalization >48 hours). No change.' },
  { id: 'd3696c68-1605-40ea-b132-c43b4a3c9e63', source_section: '14 CFR 61.57(a)(1)', note: 'Verified against current eCFR text -- citation already correct on this row. No change.' },
  { id: 'd6bcb681-4ab7-4567-aef0-c196f0f8add4', source_section: '14 CFR 91.151(a)(1)', note: 'Verified against current eCFR text. No change.' },
  {
    id: 'daeeca13-a2bc-4fce-bd39-8b2ad4598d21', source_section: '14 CFR 91.151(a)(2)',
    reference: '14 CFR 91.151(a)(2)',
    note: 'Citation corrected: the night VFR 45-minute reserve for AIRPLANES is 91.151(a)(2). The stored reference, (b), is actually the ROTORCRAFT fuel-reserve paragraph (20 minutes) -- a different rule entirely, confirmed against the full current 91.151 text. Answer content (45 minutes) already correct and unchanged.',
  },
  { id: 'de518905-dac2-413d-af49-8563bf9ed640', source_section: '49 CFR 830.2', note: 'Verified against current eCFR text. No change.' },
  { id: 'de9c9bd7-8fd0-49b4-afe8-1710f4608a5a', source_section: '14 CFR 91.157(b)(2)-(3)', note: 'Verified against current eCFR text. No change.' },
  { id: 'df09d022-85b4-43c2-bb2d-85414e8c9664', source_section: '14 CFR 91.157(b)(2)-(3)', note: 'Verified against current eCFR text. No change.' },
  { id: 'dfc0086b-5666-49ed-aa20-7f0b76af65d6', source_section: '14 CFR 61.31(f)', note: 'Verified against current eCFR text. No change.' },
  { id: 'e64051c9-7901-439f-ba5a-94311730af5b', source_section: '14 CFR 91.113(f)', note: 'Verified against current eCFR text. No change.' },
  { id: 'e7732536-3cb9-4926-a724-b56cc9555947', source_section: '14 CFR 91.203; 91.9', note: 'Verified: matches the domestic-flight ARROW-minus-radio-license answer already established in Batch 1 item 2cf81b0e. No change.' },
  {
    id: 'ea0e69f4-b357-42ca-b192-c293e2ecaad6', source_section: '14 CFR 61.39(a)(6); 61.107(a)',
    reference: '14 CFR 61.39(a)(6); 61.107(a)',
    explanation: '14 CFR 61.39(a)(6) requires an endorsement in the applicant\'s logbook, signed by an authorized instructor, certifying that the applicant has received and logged training within the preceding 2 calendar months, is prepared for the practical test, and has demonstrated satisfactory knowledge in any areas the applicant was deficient on the knowledge test. 61.107(a) separately requires the underlying training itself to cover the areas of operation for the certificate sought. A DPE endorsement is not part of the pre-test instructor certification, and no separate 60-day ground instructor endorsement is required.',
    note: 'Citation corrected: the specific "instructor certifies competency for the practical test" endorsement mechanism is 61.39(a)(6). 61.107(a) only establishes which areas of operation must be trained, not the endorsement requirement itself. Answer content (option B) already correct and unchanged.',
  },
  { id: 'efd20ee3-bc12-4e57-8603-4ec78495746d', source_section: '14 CFR 61.51(a)-(b)', note: 'Verified against current eCFR text. No change.' },
  { id: 'f0514bd2-201e-4111-b0f3-95e5cccb7d1b', source_section: '14 CFR 91.13', note: 'Verified -- 91.13 itself specifies no exact penalty; enforcement (suspension, revocation, civil penalty) comes from separate FAA enforcement authority, which the explanation accurately reflects. No change.' },
  { id: 'f121d850-8236-4142-a0f3-f8b7257fede9', source_section: '14 CFR 91.109(c)(1)(i)', note: 'Verified against current eCFR text. No change.' },
  { id: 'f4f362af-467f-420d-b2fa-a8d2f1e38262', source_section: '14 CFR 91.119(b)', note: 'Verified against current eCFR text. No change.' },
  { id: 'f6194ff8-d417-4193-b3ff-e23935e0190c', source_section: '14 CFR 91.113(d)', note: 'Verified against current eCFR text -- citation already correct on this row. No change.' },
  { id: 'f7dc98dd-20a1-45d2-9859-d15a5f208074', source_section: '14 CFR 61.113(i)', note: 'Verified against current eCFR text (BasicMed conditions: driver\'s license, medical education course, state-licensed-physician exam). No change.' },
  { id: 'fab3e87e-c27e-4d2b-9baf-52a0a51e2412', source_section: '14 CFR 91.209(a)(1)', note: 'Verified against current eCFR text. No change.' },
  { id: 'fc3ded26-dc8b-4310-af67-21f96d01b8bc', source_section: '14 CFR 61.23(a)(3)(i); 91.109(c)', note: 'Verified: third-class medical is the correct minimum for private-pilot-privilege operations, including serving as a required crewmember/safety pilot in that context. No change.' },
  { id: 'fceda025-f741-4eaf-b522-ad455bad111e', source_section: '14 CFR 91.109(c)(1)(i)', note: 'Verified against current eCFR text. No change.' },
  { id: 'fd303b2e-0851-41fd-84ec-be20585a839a', source_section: '14 CFR 61.95(a)', note: 'Verified against current eCFR text -- matches essentially verbatim, including the correct pinpoint citation already on the row. No change.' },
  { id: 'fd78d5cd-2d45-4a88-a433-956b25f00c72', source_section: '14 CFR 61.3(e)', note: 'Verified: consistent with the 61.3(e) instrument-rating requirement confirmed in Batch 5. No change.' },
  { id: 'fe51c670-f6d8-49db-ad4d-5c63a233fc11', source_section: '14 CFR 91.155(a) (table)', note: 'Verified against current eCFR table. No change.' },
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
    const logEntry = `[content-audit 2026-09-18 batch6] ${u.note}`
    const newLog = priorLog ? `${priorLog}\n${logEntry}` : logEntry

    const patch: Record<string, unknown> = {
      source_title: 'eCFR (current)',
      source_section: u.source_section,
      verified_at: now,
      verified_by: VERIFIED_BY,
      validation_log: newLog,
    }
    if (u.reference) patch.reference = u.reference
    if (u.explanation) patch.explanation = u.explanation

    const { error } = await supabase.from('questions').update(patch).eq('id', u.id)
    if (error) throw error
    ok++
  }
  const changed = updates.filter(u => u.reference || u.explanation).length
  console.log(`Batch 6 complete: ${ok}/${updates.length} questions updated (source_title/source_section/verified_at/verified_by set on all; ${changed} had a citation correction applied; 0 correct_answer changes).`)
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
