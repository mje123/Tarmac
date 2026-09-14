/**
 * Third figure type — the standard FAA approach/departure-chart "notes box" triangle
 * symbols: a bold letter inside an inverted (downward-pointing) black triangle. This
 * is a fixed, standardized FAA chart notation (not something Tarmac invents or
 * varies) — 'T' means non-standard takeoff minimums/departure procedures exist, 'A'
 * means non-standard IFR alternate minimums exist. Used to backfill a figure onto
 * existing, already-correct legacy questions that ask what one of these symbols
 * means (see scripts/backfill-iap-notes-symbol.mts) rather than generating new
 * questions — there's nothing to generate, the correct answer was already right,
 * the question was just missing the figure that makes it answerable at a glance
 * instead of purely from memorized text.
 */

export type IapNotesSymbol = 'A' | 'T'

export interface IapNotesSymbolScenario {
  symbol: IapNotesSymbol
}

const MEANING: Record<IapNotesSymbol, string> = {
  A: 'Non-standard IFR alternate minimums',
  T: 'Non-standard takeoff minimums',
}

export function renderIapNotesSymbolSvg(scenario: IapNotesSymbolScenario): string {
  const { symbol } = scenario
  return `<svg viewBox="0 0 440 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${iapNotesSymbolAccessibilityDescription(scenario)}">
  <rect x="0" y="0" width="440" height="260" fill="#0A1B3D" />
  <text x="220" y="30" fill="#FFB627" font-size="12" font-weight="bold" font-family="sans-serif" text-anchor="middle" letter-spacing="1">APPROACH CHART — NOTES BOX SYMBOL</text>

  <!-- Mock notes-box strip, for context — this symbol appears in the notes section
       of the chart header, not floating on its own. -->
  <rect x="40" y="60" width="360" height="110" rx="6" fill="#132C5E" stroke="#3E92CC" stroke-width="1.5" />
  <text x="60" y="82" fill="#8FB8DC" font-size="11" font-family="sans-serif">NOTES:</text>

  <!-- The triangle symbol itself: bold, inverted (point-down), letter centered inside -->
  <path d="M 190,95 L 250,95 L 220,150 Z" fill="#0A1B3D" stroke="#FFFFFF" stroke-width="2.5" />
  <text x="220" y="130" fill="#FFFFFF" font-size="26" font-weight="bold" font-family="sans-serif" text-anchor="middle">${symbol}</text>

  <text x="60" y="200" fill="#FFB627" font-size="15" font-weight="bold" font-family="sans-serif" text-anchor="start">▽${symbol}</text>
  <text x="90" y="200" fill="#8FB8DC" font-size="13" font-family="sans-serif" text-anchor="start">${MEANING[symbol]} apply — see the Chart Supplement.</text>
</svg>`
}

export function iapNotesSymbolAccessibilityDescription(scenario: IapNotesSymbolScenario): string {
  return `A bold letter "${scenario.symbol}" inside an inverted black triangle, as it would appear in the notes section of an FAA instrument approach or departure procedure chart. This symbol means: ${MEANING[scenario.symbol]}.`
}
