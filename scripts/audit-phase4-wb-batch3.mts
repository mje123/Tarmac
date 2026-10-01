/**
 * Phase 4 -- Weight & Balance Batch 3 (final): substantive verification.
 *
 * Category: "Weight & Balance" (PPL), final 28 unverified questions by id.
 * Every arithmetic problem independently recomputed from scratch.
 *
 * Disposition:
 *   - 21 questions: correct as-is, verified by independent recomputation.
 *     No change.
 *   - 6 explanation-only fixes, all the same recurring defect pattern seen
 *     in Batches 1-2: the stored explanation names the wrong option
 *     letter -- in c762a143 and e4de136c, actually describing the stored
 *     correct_answer itself as incorrect, directly self-contradictory
 *     (e4de136c's case is the starkest: the explanation PROVES option B
 *     correct in one sentence, then says "Option B is incorrect" in the
 *     next).
 *   - 1 fabricated-citation fix: d9737eec cited "14 CFR 23.2625," which
 *     returns a 404 on eCFR and doesn't exist anywhere in the current
 *     (post-2017 performance-based) Part 23 -- confirmed via an eCFR
 *     full-text search for "weight and balance" within Part 23, which
 *     returns zero results (the modern rewrite moved this to ASTM
 *     consensus standards rather than prescriptive CFR text). Removed the
 *     fabricated citation rather than guessing a replacement section.
 *
 * This completes the Weight & Balance category: 30 + 33 + 28 = 91
 * questions handled in Phase 4 batches, plus 11 marked outdated for the
 * broken/stale Figure 32 reference = 102/102 total.
 *
 * Run: npx tsx scripts/audit-phase4-wb-batch3.mts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const VERIFIED_BY = 'content-audit-2026-10-wb-batch3'
const now = new Date().toISOString()

interface Update {
  id: string
  source_section: string
  reference?: string
  explanation?: string
  note: string
}

const updates: Update[] = [
  {
    id: 'b83e7e22-972a-4d1e-b669-5a8a73162033', source_section: 'PHAK Ch. 10',
    explanation: "A CG at 87.3 inches falls within the approved envelope of 86.0 to 94.0 inches aft of datum, making the loading acceptable. Option A is incorrect because the CG is not outside any limit. Option B introduces a subjective 'too close' standard that does not exist in the regulations -- only the published limits matter.",
    note: 'Explanation said "Option C introduces a subjective too-close standard" -- but C is the stored correct_answer, and that subjective framing is actually option B\'s text. Corrected the attribution.',
  },
  { id: 'ba8f8294-bdd5-44b6-9e3b-a420bf4a085e', source_section: 'PHAK Ch. 10; 14 CFR 91.9', note: 'Recomputed independently: removing exactly 55 lb brings the aircraft to gross weight. Matches. No change.' },
  { id: 'bbf65e3f-a83d-4ab6-a86c-ceedc1e096cd', source_section: 'PHAK Ch. 10', note: 'Recomputed independently: 2,550 - 1,620 - 180 = 750. Matches. No change.' },
  {
    id: 'c1662009-9656-436c-9fa6-baa328cf1a57', source_section: 'PHAK Ch. 10',
    explanation: 'CG is calculated by dividing total moment by total weight: 189,000 / 2,100 = 90.0 inches aft of datum. Option A (88.3) and Option B (92.4) result from arithmetic errors. This straightforward division is the fundamental formula for locating the CG.',
    note: 'Explanation said "Option A (88.3) and Option C (92.4)" -- but C is the stored correct_answer (90.0, confirmed exact by recomputation), and 92.4 is actually option B\'s value. Corrected the attribution.',
  },
  { id: 'c280a38a-b663-4fe4-9e34-79ad6e43089e', source_section: '14 CFR 91.9', note: 'Verified: no runway-length exception to the gross weight limit. No change.' },
  { id: 'c5fa567b-282b-4a1e-9749-6a7628bc2f70', source_section: 'PHAK Ch. 10', note: 'Verified: aft CG reduces required tail-down force, consistent with the drag/fuel-consumption relationship confirmed elsewhere in this category. No change.' },
  { id: 'c6a9de1e-9c27-4bf0-96ba-2bce90df8f0a', source_section: 'PHAK Ch. 10', note: 'Verified: a point inside the loading envelope confirms both weight and CG simultaneously. No change.' },
  {
    id: 'c762a143-f76b-42e9-82b8-78507f4389bb', source_section: 'PHAK Ch. 10',
    explanation: 'Adding weight aft of the current CG increases the moment on the aft side of the balance point, shifting the CG aft. Options A and C are incorrect -- adding aft weight never moves the CG forward (option A), and the CG does shift when weight is added off-center, so it does not remain unchanged (option C).',
    note: 'Explanation said "Options A and B are incorrect" -- but B (move aft) is the stored correct_answer, confirmed right by the physics in the same sentence. Corrected the attribution to "Options A and C," the two actual distractors.',
  },
  { id: 'c8ab463d-b5d1-47ea-88e2-6dd54f195d39', source_section: 'PHAK Ch. 10; FAA-H-8083-25', note: 'Recomputed independently: 3,390 - 3,350 = 40 lb over MTOW; 40/6 = 6.67 gal. Matches. No change.' },
  { id: 'c9d47aa0-058b-4de7-94ee-f8f92c52e660', source_section: 'PHAK Ch. 10', note: 'Verified: a plot outside the envelope to the aft side indicates a CG-aft-limit exceedance, a distinct issue from gross weight. No change.' },
  {
    id: 'cb5fb624-fbb6-4e89-9c8b-61768ea2d4c2', source_section: 'PHAK Ch. 10',
    explanation: 'Useful load equals maximum gross weight minus empty weight: 2,550 - 1,480 = 1,070 lbs total useful load. Subtracting occupants (320 lbs) and fuel (180 lbs) leaves 1,070 - 320 - 180 = 570 lbs available for baggage. Options B and C reflect arithmetic errors in the calculation.',
    note: 'Explanation said "Options A and C reflect arithmetic errors" -- but A (570) is the stored correct_answer, confirmed exact by recomputation. Corrected the attribution to "Options B and C" (390 and 700, the actual wrong values).',
  },
  { id: 'cbeccee3-59e0-4395-b85b-f055c5b839b6', source_section: 'PHAK Ch. 10', note: 'Verified: moment index 92.6 falls within the 87.0-96.5 range at 2,950 lb. No change.' },
  { id: 'cc46559d-e082-4714-84c9-fdcbbf3f9822', source_section: 'PHAK Ch. 10', note: 'Verified: fuel station (75) forward of CG (87.2) burned shifts CG aft, consistent with the direction rule confirmed throughout this category. No change.' },
  { id: 'd1c496d7-dc30-4b0a-94ca-aa81666493b6', source_section: 'PHAK Ch. 5, Ch. 10', note: 'Verified: aft-CG elevator-authority hazard. No change.' },
  { id: 'd271c0ad-8f0c-4764-9308-481e42faabf6', source_section: '14 CFR 91.9; PHAK Ch. 10', note: 'Verified: gross weight and CG are independent limits; a weight exceedance grounds the flight regardless of CG compliance. No change.' },
  { id: 'd4e15e03-672b-4a37-93ea-24f998aaa415', source_section: 'PHAK Ch. 10; AC 120-27', note: 'Verified: standard wing-bending-relief rationale for zero fuel weight limits. No change.' },
  {
    id: 'd9737eec-0b34-4f8b-8cac-8d334889fb66', source_section: 'PHAK Ch. 10',
    reference: 'PHAK Chapter 10',
    note: 'Citation "14 CFR 23.2625" removed: confirmed via eCFR (direct lookup returns 404) and an eCFR full-text search for "weight and balance" scoped to Part 23 (zero results) that this section does not exist -- the modern performance-based Part 23 (effective 2017) references ASTM consensus standards for this rather than prescriptive CFR text. Rather than guess a replacement section, left the citation to PHAK Chapter 10 alone, which does accurately teach this content. Answer content (A) unchanged.',
  },
  { id: 'dc7c9d54-2a4d-49ba-abe1-90e205373615', source_section: 'PHAK Ch. 10', note: 'Verified: aft CG\'s stability-loss/stall-recovery hazard vs. forward CG\'s self-correcting nose-heavy tendency. No change.' },
  { id: 'dfa45921-22e5-4dd1-bc7a-c0162391ed2f', source_section: 'PHAK Ch. 10; 14 CFR 91.9', note: 'Verified: operating exactly at a published limit is legal but leaves no margin. No change.' },
  {
    id: 'e4de136c-f5f6-433c-b6f0-3e67f5341cd4', source_section: 'PHAK Ch. 10',
    explanation: 'Fuel at station 48 is aft of the CG at 41.2 inches. Removing weight from a station that is aft of the CG reduces the aft moment more than it reduces total weight, shifting the CG forward. Option A is incorrect because its reasoning ("lighter weight moves CG toward the heaviest load") doesn\'t account for the specific relationship between the fuel station and the CG -- the direction of shift depends on where the removed weight is relative to the CG, not simply on the aircraft getting lighter.',
    note: 'Severe self-contradiction: the stored explanation proved option B correct in one sentence, then said "Option B is incorrect" in the very next sentence -- B is the stored correct_answer. The flawed-reasoning critique actually describes option A\'s generic, station-independent claim. Corrected the attribution to option A; correct_answer (B) unchanged.',
  },
  { id: 'ebd44b1d-07ac-4529-a6d6-3f0e162d9b55', source_section: 'PHAK Ch. 10', note: 'Recomputed independently: 1,950 + 170 + 140 + 30 + 240 = 2,530. Matches. No change.' },
  { id: 'ed7ff95e-eadc-45fb-b0aa-0bffadf6c96d', source_section: 'PHAK Ch. 10; 14 CFR 23.2620', note: 'Verified: the POH/AFM is where an aircraft\'s specific W&B limits and loading envelope are published. No change.' },
  { id: 'f2901f36-dd58-4228-a2c2-f2faedce6a95', source_section: 'PHAK Ch. 10', note: 'Verified: aft CG\'s principal effect is reduced longitudinal stability. No change.' },
  { id: 'f4137ecd-227a-4a49-a6e1-6368b1a58d00', source_section: 'PHAK Ch. 10; 14 CFR 91.9', note: 'Recomputed independently: (2,910-2,750)/6 = 26.67 gal. Matches. No change.' },
  { id: 'f53a4afa-7078-46fd-83a1-53a9c5caad5d', source_section: '14 CFR 91.9; PHAK Ch. 10', note: 'Verified: CG and weight limits are independent; a CG exceedance grounds the flight regardless of weight compliance. No change.' },
  { id: 'f74a084a-2a4c-4698-a188-a07682004deb', source_section: 'PHAK Ch. 10', note: 'Verified: moment = weight x arm, the basic definition. No change.' },
  { id: 'fc632822-d0e0-492c-abff-5d24b52400c3', source_section: 'PHAK Ch. 10', note: 'Verified: CG = total moment / total weight. No change.' },
  {
    id: 'fd905992-9b2e-4da5-b528-31764428ee62', source_section: 'PHAK Ch. 10',
    explanation: 'Moment = Weight x Arm = 50 lbs x 140 inches = 7,000 pound-inches. Dividing instead of multiplying (140/50 = 2.8) yields option A, and misplacing a decimal yields option C.',
    note: 'Explanation said "dividing...yields option B" -- but B (7,000) is the stored correct_answer, confirmed exact by recomputation (50x140=7,000), and the division error (140/50=2.8) actually matches option A\'s text. Corrected the attribution.',
  },
]

async function main() {
  if (updates.length !== 28) throw new Error(`Expected 28 rows, got ${updates.length}`)

  let ok = 0
  for (const u of updates) {
    const { data: existing, error: fetchErr } = await supabase
      .from('questions')
      .select('validation_log')
      .eq('id', u.id)
      .single()
    if (fetchErr) throw fetchErr

    const priorLog = (existing?.validation_log as string | null) ?? ''
    const logEntry = `[content-audit 2026-10-01 wb-batch3] ${u.note}`
    const newLog = priorLog ? `${priorLog}\n${logEntry}` : logEntry

    const patch: Record<string, unknown> = {
      source_title: 'FAA-H-8083-25 (Pilot\'s Handbook of Aeronautical Knowledge)',
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
  console.log(`WB Batch 3 (final) complete: ${ok}/${updates.length} questions updated; ${changed} had a fix applied. Weight & Balance category fully handled: 91 verified + 11 outdated = 102/102.`)
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
