/**
 * Full-coverage (100% of the question bank, no sampling) diagnostic for the legacy
 * FAA-supplement figure system (src/lib/figures.ts) and the new figure-engine
 * pipeline (src/lib/figureEngine, figure_required column). Reports every question
 * whose figure a student cannot actually see, and every FIGURE_IMAGES entry that
 * claims an asset which doesn't actually exist in storage.
 *
 * Run: npx tsx scripts/audit-figure-supplement-system.mts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { matchFigureReference, hasUnservableFigureReference, FIGURE_IMAGES } from '../src/lib/figures'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const SUPABASE_STORAGE_BASE = 'https://vdbrfhuzyffipcjifaui.supabase.co/storage/v1/object/public/public/figures'

interface QRow {
  id: string
  question_text: string
  exam_type: string
  category: string
  figure_required: boolean
  figure_type: string | null
  figure_metadata: { svg?: string } | null
}

async function fetchAll(): Promise<QRow[]> {
  const all: QRow[] = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('id, question_text, exam_type, category, figure_required, figure_type, figure_metadata')
      .range(from, from + 999)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...(data as QRow[]))
    if (data.length < 1000) break
    from += 1000
  }
  return all
}

async function main() {
  const all = await fetchAll()
  console.log(`Total questions in bank: ${all.length}\n`)

  // 1. Legacy text-pattern figure references (FAA-CT-8080-*, "(Refer to Figure N", or
  //    natural phrasing like "Using Figure 8, ...").
  const withTextRef = all.filter(q => matchFigureReference(q.question_text))
  const unservable = withTextRef.filter(q => hasUnservableFigureReference(q.question_text))
  console.log(`=== Legacy text-referenced figures ===`)
  console.log(`Questions with a text-based figure/legend reference: ${withTextRef.length}`)
  console.log(`  -> UNSERVABLE (referenced key has no entry in FIGURE_IMAGES, so this question is filtered out of the candidate pool server-side and never reaches a student): ${unservable.length}`)
  for (const q of unservable) {
    console.log(`  UNSERVABLE  ${q.id}  [${q.exam_type}/${q.category}]  key="${matchFigureReference(q.question_text)?.key}"  "${q.question_text.slice(0, 90)}"`)
  }

  // 2. Every FIGURE_IMAGES entry must resolve to a real, fetchable asset — a broken
  //    entry here would make every question that keys to it silently render nothing
  //    (SupplementViewer shows "Image not available") while still passing the
  //    servability check above, since hasUnservableFigureReference only checks
  //    whether the KEY exists in the map, not whether the file behind it is real.
  console.log(`\n=== FIGURE_IMAGES asset existence (${Object.keys(FIGURE_IMAGES).length} entries) ===`)
  let brokenAssets = 0
  for (const [key, slug] of Object.entries(FIGURE_IMAGES)) {
    const url = `${SUPABASE_STORAGE_BASE}/${slug}.png`
    const res = await fetch(url, { method: 'HEAD' })
    if (!res.ok) {
      brokenAssets++
      console.log(`  BROKEN  ${key} -> ${slug}.png  (HTTP ${res.status})`)
    }
  }
  console.log(`Broken assets: ${brokenAssets} / ${Object.keys(FIGURE_IMAGES).length}`)

  // 3. Every text-referenced key that IS servable — cross-check how many questions
  //    actually key to each, so we know which figures are load-bearing.
  const usageByKey = new Map<string, number>()
  for (const q of withTextRef) {
    const key = matchFigureReference(q.question_text)?.key
    if (key) usageByKey.set(key, (usageByKey.get(key) ?? 0) + 1)
  }
  console.log(`\n=== Figure key usage (servable ones) ===`)
  for (const [key, count] of [...usageByKey.entries()].sort((a, b) => b[1] - a[1])) {
    const servable = key in FIGURE_IMAGES
    console.log(`  ${servable ? 'OK' : 'MISSING'}  ${key}: ${count} question(s)`)
  }

  // 4. New figure-engine pipeline rows — verify every one actually has real,
  //    non-empty SVG content stored (a figure_required=true row with empty/missing
  //    figure_metadata.svg would be worse than the legacy case: it wouldn't even be
  //    filtered out, since that filter only checks the legacy text-pattern system).
  const newPipeline = all.filter(q => q.figure_required)
  const newPipelineBroken = newPipeline.filter(q => !q.figure_metadata?.svg || q.figure_metadata.svg.length < 100)
  console.log(`\n=== New figure-engine pipeline (figure_required=true) ===`)
  console.log(`Total: ${newPipeline.length}`)
  console.log(`  BROKEN (missing/empty svg): ${newPipelineBroken.length}`)
  for (const q of newPipelineBroken) console.log(`  BROKEN  ${q.id}  [${q.figure_type}]  "${q.question_text.slice(0, 90)}"`)

  const byType = new Map<string, number>()
  for (const q of newPipeline) byType.set(q.figure_type ?? 'unknown', (byType.get(q.figure_type ?? 'unknown') ?? 0) + 1)
  for (const [type, count] of byType) console.log(`  ${type}: ${count}`)

  console.log(`\n=== SUMMARY ===`)
  console.log(`Total questions: ${all.length}`)
  console.log(`Legacy figure references: ${withTextRef.length} (${unservable.length} unservable / filtered out)`)
  console.log(`FIGURE_IMAGES entries: ${Object.keys(FIGURE_IMAGES).length} (${brokenAssets} broken)`)
  console.log(`New figure-engine questions: ${newPipeline.length} (${newPipelineBroken.length} broken)`)
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
