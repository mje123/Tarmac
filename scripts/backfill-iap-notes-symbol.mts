/**
 * Figure backfill (spec section 55): attaches a real figure to existing, already-
 * correct legacy questions that ask what a chart symbol means, instead of only
 * generating brand-new figure questions from scratch. These 3 rows were found by
 * grepping the question bank for "black triangle" IAP-notes-symbol questions — all
 * three were already factually correct, just missing the figure that makes them
 * answerable by reading a diagram instead of only from memorized text. Explicit IDs
 * (not a fuzzy text match) so this can never accidentally touch an unrelated row.
 *
 * Run: npx tsx scripts/backfill-iap-notes-symbol.mts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { renderIapNotesSymbolSvg, iapNotesSymbolAccessibilityDescription, type IapNotesSymbol } from '../src/lib/figureEngine/iapNotesSymbol'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const TARGETS: { id: string; symbol: IapNotesSymbol }[] = [
  { id: '917d189b-338d-4113-8400-5219df5d1240', symbol: 'T' }, // "significance of a 'T' symbol..." (departure)
  { id: 'b232813d-2335-494b-9163-560149fd34a6', symbol: 'A' }, // "'A' symbol in an inverted black triangle..."
  { id: '612fa5dc-f23d-4735-8913-79fdab9b22b2', symbol: 'T' }, // "'T' symbol in a black triangle... approach procedure chart"
]

async function main() {
  for (const target of TARGETS) {
    const scenario = { symbol: target.symbol }
    const svg = renderIapNotesSymbolSvg(scenario)
    const accessibilityDescription = iapNotesSymbolAccessibilityDescription(scenario)

    const { data: before, error: fetchErr } = await supabase
      .from('questions').select('id, question_text, figure_required').eq('id', target.id).single()
    if (fetchErr || !before) { console.error(`[skip] ${target.id} not found: ${fetchErr?.message}`); continue }
    if (before.figure_required) { console.log(`[skip] ${target.id} already has a figure`); continue }

    const { error: updateErr } = await supabase.from('questions').update({
      figure_required: true,
      figure_type: 'iap_notes_symbol',
      figure_source: 'synthetic_programmatic',
      figure_version: 'v1',
      figure_metadata: { svg, accessibilityDescription, scenario },
      visual_concept: `FAA approach/departure chart notes-box symbol: inverted black triangle with '${target.symbol}'`,
    }).eq('id', target.id)

    if (updateErr) { console.error(`[FAIL] ${target.id}: ${updateErr.message}`); continue }
    console.log(`[ok] ${target.id} — "${before.question_text.slice(0, 70)}..." now has a ▽${target.symbol} figure`)
  }
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
