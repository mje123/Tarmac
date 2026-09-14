/** Figure-generation abstraction. VOR navigation is the only figure type with a real
 *  generator today (ProgrammaticFigureGenerator, deterministic SVG — see vor.ts). This
 *  interface exists so a Gemini-backed generator (for figure types where deterministic
 *  geometry isn't practical — instrument-panel photorealism, weather graphics, etc.)
 *  can be plugged in later without reshaping the pipeline: concept -> scenario ->
 *  FigureSpec -> FigureGenerator -> validated FigureAsset -> attached to a question.
 *  Gemini is never the authority on the underlying aviation fact — whatever generator
 *  runs, it renders a scenario object that Tarmac's own code already computed. */

export type FigureType = 'vor_navigation' | 'instrument_panel'
export type FigureSourceType = 'synthetic_programmatic' | 'synthetic_gemini' | 'hybrid'

export interface FigureSpec<TScenario = unknown> {
  type: FigureType
  source: FigureSourceType
  scenario: TScenario
  labels: string[]
}

export interface FigureAsset {
  figureType: FigureType
  sourceType: FigureSourceType
  /** Self-contained SVG markup — stored inline in questions.figure_metadata rather
   *  than object storage, since a deterministic SVG is cheap to regenerate and this
   *  avoids standing up a separate asset-storage path for the first figure type. A
   *  Gemini-generated raster figure would instead store a storageKey/url here. */
  svg: string
  accessibilityDescription: string
  generatedBy: string
}

export interface FigureGenerator<TScenario = unknown> {
  name: string
  generate(spec: FigureSpec<TScenario>): Promise<FigureAsset>
}
