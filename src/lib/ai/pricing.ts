// Approximate published per-token pricing, used only to produce an ESTIMATED cost for
// generation-log visibility (spec sections 1 and 10) — not a billing-accurate figure.
// Update PRICING_PER_MILLION whenever a provider changes list price or a model
// constant below changes. Unknown models fall back to null (no fabricated estimate).

export interface ModelPricing {
  inputPerMillion: number
  outputPerMillion: number
}

export const PRICING_PER_MILLION: Record<string, ModelPricing> = {
  'gpt-4.1': { inputPerMillion: 2.0, outputPerMillion: 8.0 },
  'gpt-4o': { inputPerMillion: 2.5, outputPerMillion: 10.0 },
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  'gemini-2.5-flash': { inputPerMillion: 0.3, outputPerMillion: 2.5 },
  'gemini-2.5-pro': { inputPerMillion: 1.25, outputPerMillion: 10.0 },
  'gemini-1.5-pro': { inputPerMillion: 1.25, outputPerMillion: 5.0 },
  'claude-sonnet-4-6': { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  'claude-haiku-4-5-20251001': { inputPerMillion: 0.8, outputPerMillion: 4.0 },
}

export function estimateCostUsd(model: string, promptTokens?: number, completionTokens?: number): number | undefined {
  const pricing = PRICING_PER_MILLION[model]
  if (!pricing || promptTokens == null || completionTokens == null) return undefined
  return (promptTokens * pricing.inputPerMillion + completionTokens * pricing.outputPerMillion) / 1_000_000
}
