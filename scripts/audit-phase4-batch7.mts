/**
 * Phase 4 -- Batch 7: final 3 questions in the "Regulations" (PPL) category,
 * completing that category's Phase 4 pass (168/168).
 *
 * All 3 verified correct against current eCFR text (14 CFR 61.57(a)(1)
 * passenger currency; 61.113(i)/61.23(c)(3)/Part 68 BasicMed; 61.51(b)
 * solo logbook self-certification). No changes required.
 *
 * Run: npx tsx scripts/audit-phase4-batch7.mts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const VERIFIED_BY = 'content-audit-2026-09-batch7'
const now = new Date().toISOString()

const updates = [
  { id: 'fe990880-210d-44a8-99b7-3ab2931bae4c', source_section: '14 CFR 61.57(a)(1)', note: 'Verified against current eCFR text. No change.' },
  { id: 'ff59bc85-027c-4e00-ac5e-502cf49b95a4', source_section: '14 CFR 61.113(i); 61.23(c)(3); 14 CFR Part 68', note: 'Verified against current eCFR text -- 61.23(c)(3) is precisely the BasicMed-specific sub-list (medical education course, state-licensed-physician exam) cross-referenced from within 61.113(i). No change.' },
  { id: 'ffc5a979-801b-499a-b323-f47c9426f06e', source_section: '14 CFR 61.51(b)', note: 'Verified against current eCFR text (solo flight time is self-logged by the student; no per-flight instructor signature is required). No change.' },
]

async function main() {
  let ok = 0
  for (const u of updates) {
    const { data: existing, error: fetchErr } = await supabase
      .from('questions')
      .select('validation_log')
      .eq('id', u.id)
      .single()
    if (fetchErr) throw fetchErr
    const priorLog = (existing?.validation_log as string | null) ?? ''
    const logEntry = `[content-audit 2026-09-18 batch7] ${u.note}`
    const newLog = priorLog ? `${priorLog}\n${logEntry}` : logEntry

    const { error } = await supabase
      .from('questions')
      .update({
        source_title: 'eCFR (current)',
        source_section: u.source_section,
        verified_at: now,
        verified_by: VERIFIED_BY,
        validation_log: newLog,
      })
      .eq('id', u.id)
    if (error) throw error
    ok++
  }
  console.log(`Batch 7 complete: ${ok}/${updates.length} questions updated. Regulations (ppl) category now fully verified: 168/168.`)
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
