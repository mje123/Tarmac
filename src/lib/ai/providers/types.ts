// Provider-agnostic AI layer (Phase 5, spec section 1). Nothing outside this folder
// should import a provider SDK directly or care which one produced a question —
// callers depend only on this interface, selected via providers/index.ts.

import type { QuestionBlueprint } from '../blueprint'
import type { GeneratedQuestionStructured, SemanticValidationResult } from '../schema'

export type ProviderName = 'openai' | 'gemini' | 'anthropic'

export interface ProviderUsage {
  promptTokens?: number
  completionTokens?: number
  estimatedCostUsd?: number
}

export interface ProviderCallMeta {
  provider: ProviderName
  model: string
  latencyMs: number
  usage: ProviderUsage
}

export interface GenerateQuestionResult extends ProviderCallMeta {
  candidate: GeneratedQuestionStructured
}

export interface ValidateQuestionResult extends ProviderCallMeta {
  result: SemanticValidationResult
}

export interface ExplanationResult extends ProviderCallMeta {
  explanation: string
}

export interface AIProvider {
  name: ProviderName

  /** Generates ONE candidate question from a fully-specified blueprint, enforced
   *  against QUESTION_JSON_SCHEMA via the provider's native structured-output support.
   *  Untrusted until validateQuestion() (semantic) and validate.ts's deterministic
   *  checks (numeric/novelty/figure) all pass. */
  generateQuestion(blueprint: QuestionBlueprint): Promise<GenerateQuestionResult>

  /** Runs the semantic judge pass against SEMANTIC_VALIDATION_JSON_SCHEMA. Schema-valid
   *  JSON from generateQuestion() is necessary but not sufficient — this is where
   *  aviation-correctness claims actually get checked. */
  validateQuestion(
    candidate: GeneratedQuestionStructured,
    blueprint: QuestionBlueprint
  ): Promise<ValidateQuestionResult>

  /** General-purpose "explain this Q&A" helper — provider-agnostic counterpart to the
   *  ad hoc explanation prompts elsewhere in the app. Not wired into existing AI tutor
   *  UI in this phase; exposed so future callers don't need a new provider-specific path. */
  generateExplanation(input: { question: string; correctAnswer: string; ruleSummary: string }): Promise<ExplanationResult>

  /** Reserved for the future figure/vision pipeline (spec section 11) — deliberately
   *  NOT implemented in Phase 5. Every provider throws. Do not invent a fake FAA chart
   *  and present it as one; a figure-dependent question must fail or hold for review
   *  until this is built for real. */
  analyzeFigure(input: { imageUrl: string; question: string }): Promise<never>
}
