import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, GenerateQuestionResult, ValidateQuestionResult, ExplanationResult } from './types'
import type { QuestionBlueprint } from '../blueprint'
import type { GeneratedQuestionStructured, SemanticValidationResult } from '../schema'
import { QUESTION_JSON_SCHEMA, SEMANTIC_VALIDATION_JSON_SCHEMA, parseStructuredFields } from '../schema'
import { buildGenerationPrompt, buildSemanticValidationPrompt } from '../prompts'
import { estimateCostUsd } from '../pricing'
import { withTimeout } from '../withTimeout'

const CALL_TIMEOUT_MS = 30_000

// Included as the third provider (alongside OpenAI/Gemini) because it already has a
// working key in this environment and gives the vertical slice a real three-way
// comparison instead of just one live provider. Schema enforcement uses a forced
// tool call rather than response_format, since that's Anthropic's mechanism for
// guaranteed-structured output — see https://docs.claude.com tool use docs.
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_GENERATOR_MODEL || 'claude-sonnet-4-6'

// See openai.ts — an explicit timeout + limited retries so a provider problem fails
// fast and visibly instead of stalling the caller for minutes.
function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, timeout: 30_000, maxRetries: 1 })
}

async function callWithTool<T>(model: string, prompt: string, toolName: string, schema: object): Promise<{ value: T; latencyMs: number; promptTokens?: number; completionTokens?: number }> {
  const start = Date.now()
  const response = await withTimeout(client().messages.create({
    model,
    max_tokens: 2000,
    tools: [{ name: toolName, description: `Submit the ${toolName.replace(/_/g, ' ')}.`, input_schema: schema as Anthropic.Tool.InputSchema }],
    tool_choice: { type: 'tool', name: toolName },
    messages: [{ role: 'user', content: prompt }],
  }), CALL_TIMEOUT_MS, `Anthropic ${toolName}`)
  const latencyMs = Date.now() - start
  const toolUse = response.content.find(block => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') throw new Error('Anthropic did not return a tool_use block')
  return {
    value: toolUse.input as T,
    latencyMs,
    promptTokens: response.usage?.input_tokens,
    completionTokens: response.usage?.output_tokens,
  }
}

export class AnthropicProvider implements AIProvider {
  name = 'anthropic' as const

  async generateQuestion(blueprint: QuestionBlueprint): Promise<GenerateQuestionResult> {
    const { value, latencyMs, promptTokens, completionTokens } = await callWithTool<Record<string, unknown>>(
      ANTHROPIC_MODEL, buildGenerationPrompt(blueprint), 'submit_question', QUESTION_JSON_SCHEMA
    )
    return {
      candidate: parseStructuredFields(value),
      provider: 'anthropic',
      model: ANTHROPIC_MODEL,
      latencyMs,
      usage: { promptTokens, completionTokens, estimatedCostUsd: estimateCostUsd(ANTHROPIC_MODEL, promptTokens, completionTokens) },
    }
  }

  async validateQuestion(candidate: GeneratedQuestionStructured, blueprint: QuestionBlueprint): Promise<ValidateQuestionResult> {
    const { value, latencyMs, promptTokens, completionTokens } = await callWithTool<SemanticValidationResult>(
      ANTHROPIC_MODEL, buildSemanticValidationPrompt(candidate, blueprint), 'submit_validation', SEMANTIC_VALIDATION_JSON_SCHEMA
    )
    return {
      result: value,
      provider: 'anthropic',
      model: ANTHROPIC_MODEL,
      latencyMs,
      usage: { promptTokens, completionTokens, estimatedCostUsd: estimateCostUsd(ANTHROPIC_MODEL, promptTokens, completionTokens) },
    }
  }

  async generateExplanation(input: { question: string; correctAnswer: string; ruleSummary: string }): Promise<ExplanationResult> {
    const start = Date.now()
    const response = await withTimeout(client().messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Explain in 2-4 sentences why "${input.correctAnswer}" is correct for this FAA question, grounded ONLY in the rule given.\n\nQUESTION: ${input.question}\nRULE: ${input.ruleSummary}`,
      }],
    }), CALL_TIMEOUT_MS, 'Anthropic generateExplanation')
    const latencyMs = Date.now() - start
    const explanation = response.content[0]?.type === 'text' ? response.content[0].text : ''
    return {
      explanation,
      provider: 'anthropic',
      model: ANTHROPIC_MODEL,
      latencyMs,
      usage: {
        promptTokens: response.usage?.input_tokens,
        completionTokens: response.usage?.output_tokens,
        estimatedCostUsd: estimateCostUsd(ANTHROPIC_MODEL, response.usage?.input_tokens, response.usage?.output_tokens),
      },
    }
  }

  async analyzeFigure(): Promise<never> {
    throw new Error('analyzeFigure is not implemented in Phase 5 — reserved for the future figure/vision pipeline.')
  }
}
