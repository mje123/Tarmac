import OpenAI from 'openai'
import type { AIProvider, GenerateQuestionResult, ValidateQuestionResult, ExplanationResult } from './types'
import type { QuestionBlueprint } from '../blueprint'
import type { GeneratedQuestionStructured, SemanticValidationResult } from '../schema'
import { QUESTION_JSON_SCHEMA, SEMANTIC_VALIDATION_JSON_SCHEMA, parseStructuredFields } from '../schema'
import { buildGenerationPrompt, buildSemanticValidationPrompt } from '../prompts'
import { estimateCostUsd } from '../pricing'
import { withTimeout } from '../withTimeout'

const CALL_TIMEOUT_MS = 30_000

// Overridable via env so a model bump doesn't require a code change — see pricing.ts
// for the cost table keyed by this same string.
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1'

// Explicit timeout + a single retry — the SDK default (10 min, 2 retries) turns any
// rate-limit/quota/network problem into what looks like a hang rather than a fast,
// visible failure. A generation attempt failing safely means failing FAST, not
// eventually (spec section 13: timeout / rate limit must be handled, not just work).
function client() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY!, timeout: 30_000, maxRetries: 1 })
}

export class OpenAIProvider implements AIProvider {
  name = 'openai' as const

  async generateQuestion(blueprint: QuestionBlueprint): Promise<GenerateQuestionResult> {
    const start = Date.now()
    const prompt = buildGenerationPrompt(blueprint)

    const response = await withTimeout(client().chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'generated_question', schema: QUESTION_JSON_SCHEMA, strict: true },
      },
    }), CALL_TIMEOUT_MS, 'OpenAI generateQuestion')

    const latencyMs = Date.now() - start
    const text = response.choices[0]?.message?.content
    if (!text) throw new Error('OpenAI returned no content')

    const candidate = parseStructuredFields(JSON.parse(text))
    const promptTokens = response.usage?.prompt_tokens
    const completionTokens = response.usage?.completion_tokens

    return {
      candidate,
      provider: 'openai',
      model: OPENAI_MODEL,
      latencyMs,
      usage: {
        promptTokens,
        completionTokens,
        estimatedCostUsd: estimateCostUsd(OPENAI_MODEL, promptTokens, completionTokens),
      },
    }
  }

  async validateQuestion(candidate: GeneratedQuestionStructured, blueprint: QuestionBlueprint): Promise<ValidateQuestionResult> {
    const start = Date.now()
    const prompt = buildSemanticValidationPrompt(candidate, blueprint)

    const response = await withTimeout(client().chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'semantic_validation', schema: SEMANTIC_VALIDATION_JSON_SCHEMA, strict: true },
      },
    }), CALL_TIMEOUT_MS, 'OpenAI validateQuestion')

    const latencyMs = Date.now() - start
    const text = response.choices[0]?.message?.content
    if (!text) throw new Error('OpenAI returned no content')

    const result = JSON.parse(text) as SemanticValidationResult
    const promptTokens = response.usage?.prompt_tokens
    const completionTokens = response.usage?.completion_tokens

    return {
      result,
      provider: 'openai',
      model: OPENAI_MODEL,
      latencyMs,
      usage: {
        promptTokens,
        completionTokens,
        estimatedCostUsd: estimateCostUsd(OPENAI_MODEL, promptTokens, completionTokens),
      },
    }
  }

  async generateExplanation(input: { question: string; correctAnswer: string; ruleSummary: string }): Promise<ExplanationResult> {
    const start = Date.now()
    const response = await withTimeout(client().chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{
        role: 'user',
        content: `Explain in 2-4 sentences why "${input.correctAnswer}" is correct for this FAA question, grounded ONLY in the rule given.\n\nQUESTION: ${input.question}\nRULE: ${input.ruleSummary}`,
      }],
    }), CALL_TIMEOUT_MS, 'OpenAI generateExplanation')
    const latencyMs = Date.now() - start
    const explanation = response.choices[0]?.message?.content || ''
    const promptTokens = response.usage?.prompt_tokens
    const completionTokens = response.usage?.completion_tokens
    return {
      explanation,
      provider: 'openai',
      model: OPENAI_MODEL,
      latencyMs,
      usage: { promptTokens, completionTokens, estimatedCostUsd: estimateCostUsd(OPENAI_MODEL, promptTokens, completionTokens) },
    }
  }

  async analyzeFigure(): Promise<never> {
    throw new Error('analyzeFigure is not implemented in Phase 5 — reserved for the future figure/vision pipeline.')
  }
}
