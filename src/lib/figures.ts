// Single source of truth for "does this question reference a figure/chart we can
// actually display." A question that references a figure with no real backing image
// must never be served — see hasUnservableFigureReference(), used server-side in
// api/questions/random and api/sessions/start-exam to filter the candidate pool
// before any question reaches a student. Do not add entries to FIGURE_IMAGES without
// a real uploaded asset at the matching Supabase storage path — this list is
// intentionally conservative rather than complete.

export const FIGURE_IMAGES: Record<string, string> = {
  'Legend 1': 'legend-1',
  'Figure 1': 'figure-1',
  'Figure 2': 'figure-2',
  'Figure 3': 'figure-3',
  'Figure 4': 'figure-4',
  'Figure 8': 'figure-8',
  'Figure 12': 'figure-12',
  'Figure 13': 'figure-13',
  'Figure 14': 'figure-14',
  'Figure 15': 'figure-15',
  'Figure 17': 'figure-17',
  'Figure 20': 'figure-20',
  'Figure 25': 'figure-25',
  'Figure 26': 'figure-26',
  'Figure 32': 'figure-32',
  'Figure 33': 'figure-33',
  'Figure 35': 'figure-35',
  'Figure 38': 'figure-38',
  'Figure 47': 'figure-47',
  'Figure 48': 'figure-48',
  'Figure 52': 'figure-52',
  'Figure 60': 'figure-60',
  'Figure 64': 'figure-64',
  'Figure 78': 'figure-78',
}

export interface FigureReference {
  /** Normalized "Figure N" / "Legend N" key — looks up FIGURE_IMAGES. */
  key: string
  /** The supplement doc named in the text, when one is. Null for the generic
   *  "(Refer to Figure N" phrasing that doesn't name a document. */
  doc: '2H' | '3F' | null
}

// Matches "FAA-CT-8080-2H, Figure 12" or "FAA-CT-8080-3F Legend 4" — the two real FAA
// testing supplements (Private Pilot and Instrument Rating respectively). The prior
// version of this regex only matched 2H, so every IFR (3F) figure reference silently
// failed to render anything, anywhere.
const SUPPLEMENT_REF_RE = /FAA-CT-8080-(2H|3F)[,\s]+(Figures?|Legend)\s+\d+/i
const GENERIC_REF_RE = /\(Refer to (Figures?|Legend)\s+\d+/i

function normalizeKey(raw: string): string {
  return raw.replace(/\s+/g, ' ').replace(/^Figures\s/i, 'Figure ').trim()
}

export function matchFigureReference(text: string): FigureReference | null {
  const supplementMatch = text.match(SUPPLEMENT_REF_RE)
  if (supplementMatch) {
    const keyMatch = supplementMatch[0].match(/(Figures?|Legend)\s+\d+/i)
    if (!keyMatch) return null
    return { key: normalizeKey(keyMatch[0]), doc: supplementMatch[1].toUpperCase() as '2H' | '3F' }
  }
  const genericMatch = text.match(GENERIC_REF_RE)
  if (genericMatch) {
    const keyMatch = genericMatch[0].match(/(Figures?|Legend)\s+\d+/i)
    if (!keyMatch) return null
    return { key: normalizeKey(keyMatch[0]), doc: null }
  }
  return null
}

export function hasUnservableFigureReference(text: string): boolean {
  const ref = matchFigureReference(text)
  if (!ref) return false
  return !(ref.key in FIGURE_IMAGES)
}
