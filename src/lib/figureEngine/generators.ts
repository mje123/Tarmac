import type { FigureAsset, FigureGenerator, FigureSpec } from './types'
import { renderVorSvg, vorAccessibilityDescription, type VorScenario } from './vor'
import { renderInstrumentPanelSvg, instrumentAccessibilityDescription, type InstrumentScenario } from './instrumentPanel'
import { renderIapNotesSymbolSvg, iapNotesSymbolAccessibilityDescription, type IapNotesSymbolScenario } from './iapNotesSymbol'

/** Deterministic, no-AI-call renderer — every aviation fact in the output comes from
 *  the scenario object handed in, which Tarmac's own code computed; nothing here can
 *  hallucinate a radial, CDI reading, or instrument indication. Each figure type's
 *  actual geometry lives in its own module (vor.ts, instrumentPanel.ts, ...) — this
 *  is just the dispatch + FigureAsset wrapping. */
export const ProgrammaticFigureGenerator: FigureGenerator = {
  name: 'programmatic',
  async generate(spec: FigureSpec): Promise<FigureAsset> {
    if (spec.type === 'vor_navigation') {
      const scenario = spec.scenario as VorScenario
      return {
        figureType: spec.type,
        sourceType: 'synthetic_programmatic',
        svg: renderVorSvg(scenario),
        accessibilityDescription: vorAccessibilityDescription(scenario),
        generatedBy: 'programmatic:vor-v1',
      }
    }
    if (spec.type === 'instrument_panel') {
      const scenario = spec.scenario as InstrumentScenario
      return {
        figureType: spec.type,
        sourceType: 'synthetic_programmatic',
        svg: renderInstrumentPanelSvg(scenario),
        accessibilityDescription: instrumentAccessibilityDescription(scenario),
        generatedBy: 'programmatic:instrument-panel-v1',
      }
    }
    if (spec.type === 'iap_notes_symbol') {
      const scenario = spec.scenario as IapNotesSymbolScenario
      return {
        figureType: spec.type,
        sourceType: 'synthetic_programmatic',
        svg: renderIapNotesSymbolSvg(scenario),
        accessibilityDescription: iapNotesSymbolAccessibilityDescription(scenario),
        generatedBy: 'programmatic:iap-notes-symbol-v1',
      }
    }
    throw new Error(`ProgrammaticFigureGenerator has no renderer for figure type "${spec.type}"`)
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
  if (spec.type === 'vor_navigation' || spec.type === 'instrument_panel' || spec.type === 'iap_notes_symbol') return ProgrammaticFigureGenerator
  throw new Error(`No figure generator registered for figure type "${spec.type}"`)
}
