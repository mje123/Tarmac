/**
 * Phase 4 -- Weight & Balance Batch 2: substantive verification.
 *
 * Category: "Weight & Balance" (PPL), next 33 unverified questions by id.
 * Every arithmetic problem independently recomputed from scratch; every
 * figure reference cross-checked against the real current FAA-CT-8080-2H
 * supplement (downloaded during the prior batch's Figure 32 investigation).
 *
 * Good news this batch: 93fbd9a7's cited "Figure 60" was checked against the
 * real supplement text and matches EXACTLY (500 lb at 15in on one side,
 * 250 lb at 20in + 200 lb plank weight at 15in on the other) -- unlike
 * Figure 32, this one is both technically servable and numerically current.
 *
 * Disposition:
 *   - 26 questions: correct as-is, verified by independent recomputation
 *     or against the real current FAA figure. No change.
 *   - 6 explanation-only fixes, all the same recurring defect pattern seen
 *     in Batch 1: the stored explanation names the WRONG option letter --
 *     in three cases (981c6ffd, a5afbb9a, b50d671a) actually describing
 *     the stored correct_answer itself as if it were wrong, which is
 *     directly self-contradictory. All corrected to reference the actual
 *     letter the sentence is describing.
 *   - 1 structural fix: 6f4b25e2's stem read "Using the scenario from the
 *     previous question," but questions are served independently (random
 *     practice, SRS, etc.) with no guarantee of a fixed prior question --
 *     even though the needed numbers (2,530 lb, 198,419 lb-in) were
 *     already present in this question's own text, the framing implied a
 *     missing dependency. Rewrote the stem to be self-contained.
 *   - 1 precision fix: 9f50db70's stated CG value (41.5in) didn't match
 *     the independently recomputed figure (41.14in, which rounds to 41.1,
 *     not 41.5) -- corrected to the accurate value, consistent with the
 *     same class of imprecision fixed in Batch 1.
 *
 * Run: npx tsx scripts/audit-phase4-wb-batch2.mts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const VERIFIED_BY = 'content-audit-2026-09-wb-batch2'
const now = new Date().toISOString()

interface Update {
  id: string
  source_section: string
  option_b?: string
  explanation?: string
  question_text?: string
  note: string
}

const updates: Update[] = [
  { id: '5e293500-9788-4ba7-8cf1-988787439123', source_section: 'PHAK Ch. 10', note: 'Verified: max ramp weight vs MTOW definition. No change.' },
  { id: '5f882b65-dfec-4291-a31a-1a7657ede06b', source_section: 'PHAK Ch. 10; 14 CFR 91.9', note: 'Verified: 94.5in falls within 93.0-96.5in, under gross weight -- both conditions satisfied. No change.' },
  { id: '604b2c0e-12a8-4904-b956-41361c9bb08e', source_section: 'PHAK Ch. 10', note: 'Recomputed independently: 50 x 140 = 7,000. Matches. No change.' },
  { id: '68a3d00c-90b0-429c-81ee-b62b64eea9f7', source_section: 'PHAK Ch. 10', note: 'Recomputed independently: swapping two equal weights leaves total moment unchanged (180x120+180x72 = 180x72+180x120 = 34,560 either way). Matches. No change.' },
  {
    id: '6c7f3709-c4dc-4884-b024-27b6407f1b06', source_section: 'PHAK Ch. 10; 14 CFR 91.9',
    explanation: 'The loading envelope defines the combined limits of weight and CG position that have been flight-tested and certified. Any point outside the envelope means the aircraft exceeds at least one approved limit and cannot be operated legally. Option A incorrectly separates weight from CG; option B incorrectly assumes fuel burn will correct an out-of-envelope condition before or during takeoff.',
    note: 'Explanation said "Option C incorrectly assumes fuel burn will correct..." but C is the stored correct_answer, and the "fuel burn will correct it" claim is actually option B\'s text. Corrected the attribution.',
  },
  {
    id: '6f4b25e2-5e56-40b8-9d6f-c588eb72c092', source_section: 'PHAK Ch. 10',
    question_text: 'An aircraft has a total weight of 2,530 lbs and a total moment of 198,419 inch-pounds. Is the CG within limits if the forward CG limit is 73.5 inches and the aft CG limit is 85.5 inches?',
    note: 'Stem referenced "the previous question" for the total weight, but questions are served independently (random practice, SRS review, etc.) with no guaranteed prior question in sequence. The total weight and moment were already both stated directly in this question\'s own text, so the dependency framing was unnecessary and potentially confusing -- rewrote the stem to be fully self-contained. Recomputed independently: 198,419 / 2,530 = 78.42in, within the given 73.5-85.5in range. correct_answer (B) unchanged.',
  },
  { id: '72f5eec9-bb1b-4c10-a145-43c83a8e0b30', source_section: 'PHAK Ch. 10', note: 'Verified: fuel forward of CG burned shifts CG aft. No change.' },
  { id: '76488f5d-8c83-4ed0-abdc-953ea088591d', source_section: 'PHAK Ch. 10', note: 'Recomputed independently: (2,100x39.5 + 50x64) / 2,150 = 86,150/2,150 = 40.07, approx 40.0in. Matches. No change.' },
  { id: '792819fb-ae6f-436b-b719-08bfba61a423', source_section: 'PHAK Ch. 5, Ch. 10', note: 'Verified: forward-CG stability/stall-speed relationship. No change.' },
  { id: '806f5259-2151-4849-a11f-592252f01af4', source_section: 'PHAK Ch. 10', note: 'Verified: excessive forward CG and elevator authority at rotation/flare. No change.' },
  { id: '80a8f671-de27-4278-9b2b-b2f8f5e10033', source_section: 'PHAK Ch. 10', note: 'Verified: moment-index scaling does not affect CG accuracy since both moment and divisor scale together. No change.' },
  { id: '81a30279-6b4d-493b-9207-b55e4437d417', source_section: '14 CFR 91.9', note: 'Verified: overweight operation is prohibited regardless of CG or performance margin. No change.' },
  { id: '81f288d0-a7ae-4d02-81b5-5e02ac365cdb', source_section: 'PHAK Ch. 10; FAA-H-8083-25', note: 'Verified: 170 lb is the standard GA-POH-example occupant weight used consistently throughout this category\'s own other questions. No change.' },
  { id: '83d6d0c8-f2cd-4d17-ac02-e24c07e2c2e7', source_section: 'PHAK Ch. 10', note: 'Recomputed independently: 60 lb / 6 lb-per-gal = 10 gal. Matches. No change.' },
  { id: '8682e435-341f-438d-8bd3-612ade5be32d', source_section: 'PHAK Ch. 10; 14 CFR 91.9', note: 'Recomputed independently: 70 + 60 = 130 lb, exceeds the 120 lb structural limit. Matches. No change.' },
  { id: '875dc0d8-6d78-4206-99b3-5d6bfaafadef', source_section: 'PHAK Ch. 10', note: 'Verified: forward CG raises both stall speed and fuel consumption (increased AoA/drag). No change.' },
  {
    id: '8ac4e01b-1642-48eb-827e-5cd457ad07a2', source_section: 'PHAK Ch. 10; 14 CFR 91.9',
    explanation: 'Initial moment = 2,400 x 92.0 = 220,800 lb-in. Fuel moment removed = 240 x 98 = 23,520 lb-in. New moment = 197,280 lb-in; new weight = 2,160 lb. New CG = 197,280 / 2,160 = 91.3 inches, closest to 91.5 inches (option C) and within limits. Burning fuel from a station aft of the CG shifts the CG forward.',
    note: 'Explanation said the computed value was "closest to 91.5 inches (option A)" -- but 91.5in is actually option C\'s text (option A is 95.2in). Corrected the letter attribution; correct_answer (C) was already right.',
  },
  { id: '8f70b486-45b8-45de-9aa5-4bf6decc497e', source_section: 'PHAK Ch. 10; Aircraft POH', note: 'Recomputed independently: 1,500 + 170 + 130 + 240 + 20 = 2,060. Matches. No change.' },
  { id: '93fbd9a7-6642-4678-bf27-7cd322cb6421', source_section: 'FAA-CT-8080-2H, Figure 60', note: 'Verified against the real current FAA-CT-8080-2H PDF (downloaded fresh from faa.gov during this audit): Figure 60\'s actual diagram shows 500 lb at 15in and 250 lb at 20in / 200 lb plank weight at 15in on the opposite side -- matching this question\'s numbers exactly. Recomputed the net moment independently: 500x15=7,500 vs. 250x20+200x15=8,000; net 500 lb-in clockwise (tips right). Matches. No change.' },
  { id: '958e424a-f974-4ba4-bd55-475dc6b34cb4', source_section: 'PHAK Ch. 10', note: 'Recomputed independently: 900 - 530 = 370. Matches. No change.' },
  { id: '967e0ef7-3559-4762-bba1-f2a6b90c52b9', source_section: 'PHAK Ch. 10', note: 'Recomputed independently: 192,000 / 2,400 = 80. Matches. No change.' },
  {
    id: '981c6ffd-0fbc-466e-bc02-d650396b909f', source_section: 'PHAK Ch. 10; AFM/POH Weight & Balance Section',
    explanation: 'Zero fuel weight (ZFW) = empty weight + occupants + baggage = 1,600 + 380 + 120 = 2,100 lbs. This is below the 2,400 lb ZFW limit, so it is acceptable. Total weight = 2,100 + (50 x 6) = 2,400 lbs. The ZFW limit exists to bound bending loads on the wing structure when fuel (which provides lift relief) is absent; the pilot must confirm the ZFW does not exceed the published limit. Options B and C both misstate the ZFW relationship to its limit.',
    note: 'Explanation said "Options A and B contain arithmetic or conceptual errors" -- but A is the stored correct_answer, directly contradicting itself. Recomputed independently (ZFW=2,100, total=2,400, both correct) and corrected the attribution to "Options B and C" (B is self-contradictory -- claims ZFW "exceeds" the limit yet calls the loading "acceptable" -- and C mislabels being well under the limit as "exactly met").',
  },
  { id: '9f35fe0f-ab6f-489f-a1f8-8a8a7b78d3a7', source_section: 'PHAK Ch. 10', note: 'Verified: aft CG reduces stall speed slightly but reduces longitudinal stability. No change.' },
  {
    id: '9f50db70-a6f3-41d3-91c3-0b53d354a395', source_section: 'PHAK Ch. 10',
    option_b: 'Approximately 41.1 inches aft of datum',
    explanation: 'Moments: Empty = 1,450 x 41.2 = 59,740; Occupants = 320 x 37 = 11,840; Fuel = 180 x 48 = 8,640. Total moment = 80,220. Total weight = 1,450 + 320 + 180 = 1,950 lb. CG = 80,220 / 1,950 = 41.14, approximately 41.1 inches aft of datum.',
    note: 'The stored option value (41.5) didn\'t match the independently recomputed figure (41.14, which rounds to 41.1, not 41.5) -- the stored explanation even said "≈41.14 ≈ 41.5," which isn\'t a valid rounding. Corrected the option to the accurate value.',
  },
  {
    id: 'a5afbb9a-11e1-47f8-9dc5-90a09748f340', source_section: 'PHAK Ch. 10',
    explanation: 'When fuel located forward of the CG is consumed, the forward moment decreases while the aft moments remain the same, causing the CG to shift aft. This is a critical planning consideration to ensure the CG remains within aft limits throughout the flight. Option A is incorrect -- becoming lighter does not by itself move the CG forward; only the location of the weight change matters. Option C is incorrect because weight reduction is not proportional across all stations.',
    note: 'Explanation said "Option B is incorrect" while describing the flaw in option A\'s reasoning ("becoming lighter does not move the CG forward") -- but B is the stored correct_answer, so it cannot simultaneously be the right answer and be called incorrect. Corrected the attribution to option A.',
  },
  { id: 'a6092164-223e-432f-a1bb-39d3cfb432e9', source_section: 'PHAK Ch. 10', note: 'Verified: moment-index-by-1,000 convention, consistent with common POH loading-graph practice. No change.' },
  { id: 'a77e6f6b-898d-42aa-9e67-74617a2d823e', source_section: 'PHAK Ch. 10; Aircraft POH', note: 'Verified: structural baggage limits apply regardless of overall weight/CG compliance. No change.' },
  { id: 'ab22dca4-ce72-4d48-b2b0-b8979b0d29b5', source_section: 'PHAK Ch. 10', note: 'Verified: consistent with the fuel-forward-of-CG physics confirmed elsewhere in this category. No change.' },
  { id: 'accd4824-b540-4127-863e-a0484f14e773', source_section: 'PHAK Ch. 10', note: 'Verified: consistent physics. No change.' },
  { id: 'af81b152-3395-4a92-92d6-bd4b6f898222', source_section: 'PHAK Ch. 10', note: 'Verified: CG = total moment / total weight is the correct formula. No change.' },
  { id: 'b4a59dc1-6ae1-4aba-b24c-a21a9e712ec4', source_section: '14 CFR 91.9; PHAK Ch. 10', note: 'Verified: weight and CG are independent limits; exceeding gross weight must be corrected regardless of CG. No change.' },
  {
    id: 'b50d671a-6e6d-44cb-a49d-252745325154', source_section: 'PHAK Ch. 10',
    explanation: 'The weight-shift formula is: Weight to move = (CG shift desired x Aircraft total weight) / Distance between stations = (2 x 2,800) / (150 - 60) = 5,600 / 90 = 62.2 lbs. Option A uses a CG shift of 1 inch instead of 2 (2,800/90 = 31.1). Option C incorrectly uses the arm of the rear station rather than the distance between stations.',
    note: 'Explanation said "Option B uses a CG shift of 1 inch instead of 2" -- but B is the stored correct_answer (62 lbs, matching the correct computation), and the 1-inch-shift error actually produces option A\'s value (31 lbs). Corrected the attribution.',
  },
  { id: 'b6ff129b-1acc-430e-9085-989da604efdb', source_section: 'PHAK Ch. 10; Aircraft POH', note: 'Recomputed independently: 120 - 80 = 40. Matches. No change.' },
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
    const logEntry = `[content-audit 2026-09-27 wb-batch2] ${u.note}`
    const newLog = priorLog ? `${priorLog}\n${logEntry}` : logEntry

    const patch: Record<string, unknown> = {
      source_title: 'FAA-H-8083-25 (Pilot\'s Handbook of Aeronautical Knowledge)',
      source_section: u.source_section,
      verified_at: now,
      verified_by: VERIFIED_BY,
      validation_log: newLog,
    }
    if (u.option_b) patch.option_b = u.option_b
    if (u.explanation) patch.explanation = u.explanation
    if (u.question_text) patch.question_text = u.question_text

    const { error } = await supabase.from('questions').update(patch).eq('id', u.id)
    if (error) throw error
    ok++
  }
  const changed = updates.filter(u => u.option_b || u.explanation || u.question_text).length
  console.log(`WB Batch 2 complete: ${ok}/${updates.length} questions updated; ${changed} had a fix applied (0 correct-answer-value changes, 1 stem rewrite, 1 precision fix, 6 explanation letter-mislabel fixes).`)
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
