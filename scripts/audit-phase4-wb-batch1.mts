/**
 * Phase 4 -- Weight & Balance Batch 1: substantive verification.
 *
 * Category: "Weight & Balance" (PPL), first 33 questions by id. Unlike the
 * Regulations category (mostly citation-recall, self-consistent), this
 * category is arithmetic-heavy, and independently RECOMPUTING every problem
 * by hand surfaced far more serious defects than a citation check would --
 * several explanations contain visible, self-admitted wrong arithmetic that
 * was never fixed before being marked as the "correct" answer.
 *
 * 3 of the original 33 (22e6a82a, 521b5758, 55c8dac4) were pulled out and
 * marked `outdated` in a separate pass (audit-figure32-outdated.mts) after
 * discovering the Figure 32 asset they depend on is corrupt AND the current
 * real FAA-CT-8080-2H supplement shows a different aircraft's data at that
 * figure number entirely. This script covers the remaining 30.
 *
 * Disposition:
 *   - 19 questions: correct as-is (verified by independent recomputation
 *     of every arithmetic problem, not just citation-checked). No change.
 *   - 2 REAL CORRECT-ANSWER ERRORS, both confirmed by recomputing the
 *     stated inputs from scratch:
 *     - 2b4da8e5: total weight 2,378 lb, total moment 95,522 lb-in (both
 *       independently re-summed from the four given weight/moment pairs).
 *       True CG = 95,522 / 2,378 = 40.17in. The marked answer (88.8in)
 *       does not correspond to ANY combination of the given numbers --
 *       confirmed hallucinated. Fixed to state the correct value.
 *     - 3704f585: total moment = 51,500 + 11,840 + 22,630 = 85,970 lb-in
 *       (independently re-verified). The marked answer (96,690) is wrong,
 *       and remarkably, the STORED EXPLANATION ITSELF computed 85,970 and
 *       then talked itself into a different "closest provided answer" via
 *       an invented alternate empty-weight-moment scenario not in the
 *       question -- a self-admitted wrong answer that was never corrected.
 *       Fixed to state the correct value.
 *   - 1 STEM DATA ERROR: 4696f2c8's given moment figure (1,080) doesn't
 *     yield the marked answer (60in) under any consistent reading the
 *     explanation itself tries and fails to justify. Corrected the stem's
 *     number to 10,800, which cleanly produces 60in and matches the
 *     question's own realistic-arm pattern (consistent with the 56-95in
 *     fuel arms seen elsewhere in this same category).
 *   - 8 explanation-only fixes: a garbled, visibly-corrupted option A (AI
 *     reasoning trace leaked into the answer text itself -- "wait, CG
 *     = ... which IS within limits" inside a "No" answer), two imprecise
 *     option values corrected to their exact computed figures (92.1 not
 *     92.4; 41,450 not 41,200), and five dangling "Option A/B/C"
 *     explanation references that named the wrong letter relative to the
 *     stored correct_answer.
 *
 * Run: npx tsx scripts/audit-phase4-wb-batch1.mts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const VERIFIED_BY = 'content-audit-2026-09-wb-batch1'
const now = new Date().toISOString()

interface Update {
  id: string
  source_section: string
  option_a?: string
  option_b?: string
  explanation?: string
  question_text?: string
  note: string
}

const updates: Update[] = [
  { id: '058a33e6-1298-411e-82cc-c5f93a19ba68', source_section: 'PHAK Ch. 10', note: 'Recomputed independently: 186,500 / 2,150 = 86.74. Matches. No change.' },
  { id: '083deeb7-2940-44f3-ad31-7103ff3989b7', source_section: 'PHAK Ch. 10', note: 'Verified: standard W&B physics (fuel burn forward of CG shifts CG aft). No change.' },
  { id: '091822e3-7d27-4b4d-b913-eead677c035a', source_section: 'PHAK Ch. 10', note: 'Recomputed independently: 50 gal x 6 lb/gal = 300 lb; 16,800 / 300 = 56in. Matches. No change.' },
  {
    id: '0a3032f6-2b62-4ada-a1dd-5e4faacacb1e', source_section: 'PHAK Ch. 10',
    option_a: 'No, the CG falls outside the specified limits',
    note: 'Option A contained a visible leaked AI-reasoning artifact ("No, the CG of 94.0 inches is within limits — wait, CG = 291,400 ÷ 3,100 = 94.0 inches, which IS within limits") instead of a clean, coherent distractor. Recomputed 291,400/3,100 = 94.0 exactly, confirming correct_answer C is right (94.0 is within the 92.0-98.5 range). Rewrote option A as a clean, unambiguous (wrong) statement.',
  },
  { id: '0d8ccb56-9261-4c2b-8022-2f7d123a8218', source_section: 'PHAK Ch. 10', note: 'Verified: standard aft-CG stability fact. No change.' },
  { id: '0dde11ca-865f-456f-9c81-76b14ce71ca8', source_section: 'PHAK Ch. 10; 14 CFR 91.9', note: 'Verified: weight and CG are independent limits, both must be satisfied. No change.' },
  { id: '137f47e1-1ea9-4301-be4f-b67a04b220b3', source_section: 'PHAK Ch. 10', note: 'Verified: datum location is manufacturer-defined per the AFM/POH. No change.' },
  { id: '1cd9685f-6c37-4261-84a6-46655fc50723', source_section: 'PHAK Ch. 10', note: 'Verified: standard W&B physics. No change.' },
  { id: '230b0be8-56f1-4e6d-86b7-f65fc0ee7a67', source_section: 'PHAK Ch. 10', note: 'Verified: loading-envelope definition. No change.' },
  { id: '27cdb38c-57eb-42ab-9224-3ed8b3ac8ae7', source_section: 'PHAK Ch. 10', note: 'Verified: consistent with 083deeb7. No change.' },
  {
    id: '29c63028-d932-499c-a7f3-95fd66ab0a1e', source_section: 'PHAK Ch. 10',
    explanation: 'A forward CG increases longitudinal stability because the nose-heavy tendency requires more back elevator pressure to maintain level flight, which also increases the aircraft\'s effective stall speed. Options A and B are incorrect: a forward CG does not increase cruise speed, and it does the opposite of option B\'s claim (it increases, not decreases, stability).',
    note: 'Explanation referenced "Options A and C" and said the effect is "the opposite of option C" -- but C is the stored correct_answer itself, so it cannot simultaneously be the right answer and the thing being contradicted. Corrected to reference option B (the actual "decreases stability" distractor). correct_answer (C) unchanged -- the underlying aeromedical/aerodynamic fact was already right.',
  },
  { id: '2aeb846d-f06a-43b3-adfe-a4d34ce1f040', source_section: 'PHAK Ch. 10', note: 'Verified: loading-envelope exceedance requires load adjustment. No change.' },
  {
    id: '2b4da8e5-3dd7-4656-ab7e-46ec73e79bb5', source_section: 'PHAK Ch. 10',
    option_b: 'Approximately 40.2 inches aft of datum',
    explanation: 'Total weight: 1,600 + 340 + 210 + (38 x 6 lb/gal = 228) = 2,378 lb. Total moment: 59,200 + 12,580 + 10,290 + 13,452 = 95,522 lb-in. CG = 95,522 / 2,378 = 40.17, approximately 40.2 inches aft of datum. (Each individual arm implied by the given weight/moment pairs -- 37in, 37in, 49in, and 59in respectively -- is realistic for a small GA aircraft, confirming the inputs are internally consistent; only the previously-stated final answer was wrong.)',
    note: 'CORRECT-ANSWER ERROR, confirmed by independently re-summing all four given weight/moment pairs from scratch: true CG = 40.17in. The previously marked answer (88.8in) does not correspond to any combination of the stated numbers -- not the stated total, not a partial sum, nothing. Corrected option B to the true computed value.',
  },
  { id: '2fe5d635-e6f6-4f0a-85d3-f0f3bdef1240', source_section: 'PHAK Ch. 10', note: 'Verified: avgas ~6 lb/gal is the standard figure used throughout this category\'s own other questions. No change.' },
  { id: '30527674-f4cb-4d62-af4b-6c8233cc891f', source_section: 'PHAK Ch. 10; 14 CFR 91.9', note: 'Verified: CG must remain within limits across the full fuel-burn range, including zero fuel. No change.' },
  {
    id: '30d71525-3486-4110-b474-eb184c70ced1', source_section: 'PHAK Ch. 10',
    explanation: 'To move the CG forward, weight must be removed from stations behind the CG or added to stations ahead of the CG. Removing weight from the aft baggage area and placing it forward (option C) accomplishes this. Options A and B both shift weight aft instead (moving occupants rearward, or adding fuel only to aft tanks), which would worsen an aft-CG exceedance rather than correct it.',
    note: 'Explanation said "Options B and C both shift weight aft" -- but C is the stored correct_answer and the one action that shifts weight FORWARD, so it cannot belong in that list. Corrected to "Options A and B." correct_answer (C) unchanged.',
  },
  {
    id: '3114e285-3310-4833-b699-a52d49cdac77', source_section: 'PHAK Ch. 10',
    explanation: 'CG is found by dividing total moment by total weight: 216,000 / 2,400 = 90 inches aft of datum. Option A incorrectly multiplies weight and moment together instead of dividing. Option B is the moment divided by 1,000 instead of by the actual weight.',
    note: 'Explanation said "Option C incorrectly multiplies weight and moment" -- but C (90) is the stored correct_answer, confirmed exactly right by recomputation (216,000/2,400 = 90 precisely). The multiplication error actually describes option A (518,400,000 = 2,400 x 216,000). Corrected the attribution.',
  },
  { id: '363f5347-f17e-4e5c-a710-2ec915e2d68f', source_section: 'PHAK Ch. 10; 14 CFR 91.9', note: 'Verified: no tolerance allowance exists for CG limit exceedances. No change.' },
  {
    id: '3704f585-ef49-4389-bae5-493d24d0b469', source_section: 'PHAK Ch. 10',
    option_b: '85,970 pound-inches',
    explanation: 'Pilot + front passenger: (180 + 140) x 37 = 320 x 37 = 11,840 lb-in. Rear passengers: 310 x 73 = 22,630 lb-in. Empty aircraft moment (given directly): 51,500 lb-in. Total = 51,500 + 11,840 + 22,630 = 85,970 pound-inches.',
    note: 'CORRECT-ANSWER ERROR: the stored explanation itself computed 85,970 as the correct sum, then abandoned that result in favor of the pre-selected "correct_answer" (96,690) by inventing an alternate empty-weight-moment figure (62,220) that appears nowhere in the question -- a self-admitted wrong answer that was never actually corrected. Verified independently: 85,970 is right. Corrected option B to the true value and rewrote the explanation cleanly.',
  },
  {
    id: '42f8b308-0d43-4201-88f9-e690c7ef111f', source_section: '14 CFR 91.9', note: 'Verified: no regulatory allowance for overweight takeoff pending fuel burn-off. No change.',
  },
  {
    id: '4696f2c8-aa31-459c-bc8a-7a72ccd39ecc', source_section: 'PHAK Ch. 10',
    question_text: "An aircraft's POH moment table shows the following for fuel: 30 gallons produces a moment of 10,800 pound-inches. If fuel weighs 6 lbs/gallon, what is the fuel tank arm?",
    explanation: '30 gallons x 6 lbs/gallon = 180 lbs. Arm = Moment / Weight = 10,800 / 180 = 60 inches aft of datum.',
    note: 'Stem data error: the originally-given moment (1,080) does not produce the marked answer (60in) under any consistent reading -- the stored explanation itself tried three different interpretations (/100, /1000, as-is) and admitted none worked, then asserted the answer anyway. 10,800 / 180 = 60 exactly, and a ~60in fuel arm is consistent with the realistic arms (56-95in) seen elsewhere in this category. Corrected the stem\'s stated moment to 10,800 and rewrote the explanation cleanly; correct_answer (B, 60in) unchanged.',
  },
  {
    id: '47d07228-2f44-409f-b8b4-8ecf13442328', source_section: 'PHAK Ch. 10',
    explanation: 'Combined front-seat weight = 180 + 160 = 340 lbs. Combined moment = 340 x 85 = 28,900 inch-pounds.',
    note: 'Recomputed independently: 340 x 85 = 28,900, matching the stored correct_answer (C) exactly. The stored explanation\'s distractor commentary referenced a value (15,300) that doesn\'t match either remaining option, so it was confusing without being wrong on the actual answer -- simplified to just the correct computation.',
  },
  { id: '4a929893-a1a0-41ed-b431-6bd92eea9abe', source_section: 'PHAK Ch. 10', note: 'Recomputed independently: 170 + 145 + 288 = 603; 890 - 603 = 287. Matches. No change.' },
  {
    id: '4b4667f0-4bac-49e4-8850-694da0e037c4', source_section: 'PHAK Ch. 10',
    option_a: 'Approximately 92.1 inches, within the forward portion of the envelope',
    explanation: 'New moment: 225,600 + (60 x 15) = 226,500 lb-in. New weight: 2,400 + 60 = 2,460 lb. New CG = 226,500 / 2,460 = 92.07, approximately 92.1 inches -- forward of the aft limit of 93.5 inches. Adding nose ballast shifts the CG forward as expected.',
    note: 'The stored option value (92.4) was imprecise -- independently recomputed CG = 92.07, which rounds to 92.1, not 92.4 (a 0.3in gap too large to be simple rounding, as the previous explanation\'s hand-wave claimed). The qualitative conclusion (now forward of the 93.5 aft limit) was already correct and is unaffected; corrected the stated value to the accurate figure.',
  },
  { id: '4f4a4791-660c-44d7-9831-c3f9aa219a91', source_section: 'PHAK Ch. 10; FAA-H-8083-25', note: 'Verified: standard definition of max ramp/taxi weight vs. MTOW. No change.' },
  { id: '512d6dc6-26ad-4292-a504-eed1e30caf93', source_section: 'PHAK Ch. 10', note: 'Verified: moving weight forward shifts CG forward; explanation correctly identifies both distractors as aft-shifting. No change.' },
  {
    id: '54942b49-bff8-4891-b3f8-5ba0cce2d878', source_section: 'PHAK Ch. 10',
    explanation: 'The relationship is linear: each 10 lbs adds 1.3 index units, so each pound adds 0.13 index units. 25 lbs x 0.13 = 3.25, matching the interpolation between 20 lbs (2.6) and 30 lbs (3.9): halfway = 3.25. Options A and B do not correspond to the linear interpolation.',
    note: 'Explanation said "Options B and C do not correspond" -- but C (3.25) is the stored correct_answer, confirmed exactly right by recomputation. Corrected the attribution to "Options A and B."',
  },
  { id: '5ab6fce3-a10c-48e2-a785-b8f4ee80774c', source_section: 'PHAK Ch. 10', note: 'Verified: loading-envelope purpose. No change.' },
  { id: '5cb4ab25-6c01-4115-809c-65fb3c3a892c', source_section: 'PHAK Ch. 10', note: 'Verified: forward-CG effects on stall speed and flare authority. No change.' },
  {
    id: '5dbc9477-3a7c-4cf7-afac-bcbf4cb2c549', source_section: 'PHAK Ch. 10',
    option_b: '41,450 lb-in',
    explanation: 'Pilot moment: 170 x 85 = 14,450 lb-in. Baggage moment: 30 x 140 = 4,200 lb-in. Fuel moment: 240 x 95 = 22,800 lb-in. Total = 14,450 + 4,200 + 22,800 = 41,450 lb-in.',
    note: 'The stored option value (41,200) was off by 250 from the independently recomputed total (41,450) -- the stored explanation even computed 41,450 itself, then reported "41,200 (closest answer)" instead of the exact value. Corrected option B to the precise computed figure.',
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
    const logEntry = `[content-audit 2026-09-23 wb-batch1] ${u.note}`
    const newLog = priorLog ? `${priorLog}\n${logEntry}` : logEntry

    const patch: Record<string, unknown> = {
      source_title: 'FAA-H-8083-25 (Pilot\'s Handbook of Aeronautical Knowledge), Ch. 10',
      source_section: u.source_section,
      verified_at: now,
      verified_by: VERIFIED_BY,
      validation_log: newLog,
    }
    if (u.option_a) patch.option_a = u.option_a
    if (u.option_b) patch.option_b = u.option_b
    if (u.explanation) patch.explanation = u.explanation
    if (u.question_text) patch.question_text = u.question_text

    const { error } = await supabase.from('questions').update(patch).eq('id', u.id)
    if (error) throw error
    ok++
  }
  const changed = updates.filter(u => u.option_a || u.option_b || u.explanation || u.question_text).length
  console.log(`WB Batch 1 complete: ${ok}/${updates.length} questions updated; ${changed} had a content fix applied (2 correct-answer-value fixes, 1 stem data fix, 8 explanation-only fixes). Plus 3 already marked outdated in a separate pass (33 total in this fetch).`)
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
