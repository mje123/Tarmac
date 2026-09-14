import type { FigureAsset, FigureGenerator, FigureSpec } from './types'
import { renderVorSvg, vorAccessibilityDescription, type VorScenario } from './vor'

/** Deterministic, no-AI-call renderer — the only generator implemented so far. Every
 *  aviation fact in the output comes from the scenario object handed in, which Tarmac's
 *  own code computed; nothing here can hallucinate a radial or CDI reading. */
export const ProgrammaticFigureGenerator: FigureGenerator<VorScenario> = {
  name: 'programmatic',
  async generate(spec: FigureSpec<VorScenario>): Promise<FigureAsset> {
    if (spec.type !== 'vor_navigation') {
      throw new Error(`ProgrammaticFigureGenerator has no renderer for figure type "${spec.type}"`)
    }
    return {
      figureType: spec.type,
      sourceType: 'synthetic_programmatic',
      svg: renderVorSvg(spec.scenario),
      accessibilityDescription: vorAccessibilityDescription(spec.scenario),
      generatedBy: 'programmatic:vor-v1',
    }
  },
}

/** Not implemented yet — deliberately left as a documented stub rather than removed.
 *  The existing Gemini integration (src/lib/ai/providers/gemini.ts, using
 *  @google/generative-ai) only supports structured TEXT/JSON output
 *  (responseMimeType: 'application/json'); it has never been exercised for image
 *  generation in this codebase. Gemini image generation is a different request shape
 *  (responseModalities including 'image', a vision-capable model such as
 *  gemini-2.5-flash-image) that this SDK version supports but nothing here calls yet.
 *  When a figure type needs photorealistic/stylistic generation rather than exact
 *  geometry (e.g. an instrument-panel scene), implement generate() here using that
 *  request shape, fed a FigureSpec whose scenario was computed the same way VOR's is —
 *  never let Gemini invent the scenario itself. */
export const GeminiFigureGenerator: FigureGenerator = {
  name: 'gemini',
  async generate(): Promise<FigureAsset> {
    throw new Error(
      'GeminiFigureGenerator is not implemented. The current Gemini integration ' +
      '(@google/generative-ai, gemini-2.5-flash) only does structured text/JSON output. ' +
      'Image generation needs a request with responseModalities including "image" against ' +
      'a vision-capable Gemini model — implement that call here when a figure type needs it.'
    )
  },
}

export function getFigureGenerator(spec: FigureSpec): FigureGenerator {
  if (spec.type === 'vor_navigation') return ProgrammaticFigureGenerator
  throw new Error(`No figure generator registered for figure type "${spec.type}"`)
}
