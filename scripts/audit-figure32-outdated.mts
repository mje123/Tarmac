/**
 * Fix for a production bug discovered during the Weight & Balance Phase 4
 * verification pass: the "Figure 32" asset (figures/figure-32.png in Supabase
 * Storage) is not actually a PNG -- `file` identifies it as a QuickTime .mov
 * file with a .png extension. Every question citing it renders a broken image.
 * The FIGURE_IMAGES entry has already been removed (src/lib/figures.ts) so the
 * validation gate now correctly treats these as unservable going forward.
 *
 * But the deeper problem is worse than a bad upload: the REAL, current
 * FAA-CT-8080-2H supplement (downloaded fresh from faa.gov during this audit)
 * shows a completely different aircraft at Figure 32/33 than what these 11
 * questions assume -- empty weight ~2,015 lb, fuel tank arms 75/94, CG limits
 * 82.1-84.7in at 2,950 lb, vs. the questions' assumed ~1,393 lb empty weight,
 * ~48in fuel arm, and CG limits around 35-48in. The FAA has revised this
 * supplement since these questions were written; the figure numbers now point
 * at different content entirely. This can't be fixed by re-uploading a correct
 * image -- the questions' own numbers no longer correspond to any real current
 * Figure 32/33. Marked `outdated` rather than `rejected`: the content was
 * presumably valid against a prior edition of the supplement, and the ledger
 * should reflect that this is a source-drift problem, not a fabrication.
 *
 * Run: npx tsx scripts/audit-figure32-outdated.mts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const VERIFIED_BY = 'content-audit-2026-09-figure32-outdated'
const now = new Date().toISOString()

const ids = [
  '521b5758-fa2d-46dc-879b-e31f9e0e31ef',
  '22e6a82a-3bbf-433a-9ee6-1cc4c3a5eb2f',
  'ea8d180c-dcf4-4fac-8958-9cafaf324d2c',
  '8c3d6d02-0d17-4a82-832b-2cb9ad37f5c7',
  'b453ae24-826e-4ce9-a001-ec3dec710b9d',
  'dec98888-b812-4dff-90e6-f12b391dd5e1',
  'c6bf12f0-60af-4ab5-a1c4-dbc55d468204',
  'a65192a1-e191-495a-87c7-ddba72bec661',
  '55c8dac4-9b4c-4160-96a7-cbdb253420e9',
  '7b3ef613-d8c7-4113-9f0e-2896683e9e4e',
  '6eeba9ab-8390-4319-a2ca-9a0d34b9be1e',
]

const validationLog =
  '[content-audit 2026-09-23 figure32] OUTDATED: cites "FAA-CT-8080-2H, Figures 32 and 33." ' +
  'The uploaded Figure 32 asset is corrupt (a QuickTime video mislabeled .png, confirmed via ' +
  '`file` on the downloaded bytes) -- but re-uploading a correct image would not fix this ' +
  'question, because the CURRENT real FAA-CT-8080-2H supplement (downloaded fresh from ' +
  'faa.gov/training_testing/testing/supplements during this audit) shows a different aircraft ' +
  'at Figure 32/33 than this question assumes: empty weight ~2,015 lb, fuel tank arms 75/94, ' +
  'CG limits 82.1-84.7in at 2,950 lb -- vs. this question\'s assumed ~1,393 lb empty weight and ' +
  '~35-48in CG range. The FAA has revised this supplement since this question was written; the ' +
  'figure numbers now point at unrelated content. Cannot be corrected by re-uploading an image; ' +
  'would need to be rewritten from scratch against the current real chart, which is new-content ' +
  'authoring, out of scope for a verification pass. Marked outdated rather than rejected because ' +
  'the content was presumably valid against a prior edition of the supplement.'

async function main() {
  let ok = 0
  for (const id of ids) {
    const { error } = await supabase
      .from('questions')
      .update({
        validation_status: 'outdated',
        source_title: 'FAA-CT-8080-2H (current edition, 2018)',
        source_section: 'Figure 32/33 -- content mismatch',
        verified_at: now,
        verified_by: VERIFIED_BY,
        validation_log: validationLog,
      })
      .eq('id', id)
    if (error) throw error
    ok++
  }
  console.log(`Marked ${ok}/${ids.length} Figure-32/33 questions as outdated.`)
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
