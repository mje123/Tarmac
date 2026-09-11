import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai'
import type { AIProvider, GenerateQuestionResult, ValidateQuestionResult, ExplanationResult } from './types'
import type { QuestionBlueprint } from '../blueprint'
import type { GeneratedQuestionStructured, SemanticValidationResult } from '../schema'
import { QUESTION_JSON_SCHEMA, SEMANTIC_VALIDATION_JSON_SCHEMA, parseStructuredFields } from '../schema'
import { buildGenerationPrompt, buildSemanticValidationPrompt } from '../prompts'
import { estimateCostUsd } from '../pricing'
import { withTimeout } from '../withTimeout'

const CALL_TIMEOUT_MS = 30_000

// NOTE: implemented against the documented @google/generative-ai structured-output API,
// but NOT exercised against a live API key in this environment (GEMINI_API_KEY was not
// present in .env.local as of Phase 5's vertical slice — see the Phase 5 report). Treat
// as code-complete, not verified, until run once with a real key.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

// Gemini's Schema type doesn't support "type": [x, "null"] unions — collapsed to the
// primary type plus `nullable: true`. QUESTION_JSON_SCHEMA has no dynamic-key objects
// left (variables/calculation_inputs are JSON-encoded strings — see schema.ts), so this
// converter no longer needs any field-name special-casing.
function toGeminiSchema(node: Record<string, unknown>): Schema {
  const rawType = node.type
  const types = Array.isArray(rawType) ? rawType : [rawType]
  const nullable = types.includes('null')
  const primaryType = types.find(t => t !== 'null') as string

  if (primaryType === 'object') {
    const props = (node.properties as Record<string, Record<string, unknown>>) || {}
    const properties: Record<string, Schema> = {}
    for (const [propKey, propSchema] of Object.entries(props)) {
      properties[propKey] = toGeminiSchema(propSchema)
    }
    return {
      type: SchemaType.OBJECT,
      properties,
      required: (node.required as string[]) || Object.keys(properties),
      nullable,
    } as Schema
  }
  if (primaryType === 'array') {
    return { type: SchemaType.ARRAY, items: toGeminiSchema(node.items as Record<string, unknown>), nullable } as Schema
  }
  if (primaryType === 'boolean') return { type: SchemaType.BOOLEAN, nullable } as Schema
  if (primaryType === 'number') return { type: SchemaType.NUMBER, nullable } as Schema

  const enumValues = node.enum as string[] | undefined
  return { type: SchemaType.STRING, enum: enumValues, nullable } as Schema
}

function client() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
}

export class GeminiProvider implements AIProvider {
  name = 'gemini' as const

  async generateQuestion(blueprint: QuestionBlueprint): Promise<GenerateQuestionResult> {
    const start = Date.now()
    const model = client().getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: toGeminiSchema(QUESTION_JSON_SCHEMA),
      },
    })

    const result = await withTimeout(model.generateContent(buildGenerationPrompt(blueprint), { timeout: CALL_TIMEOUT_MS }), CALL_TIMEOUT_MS, 'Gemini generateQuestion')
    const latencyMs = Date.now() - start
    const text = result.response.text()
    const candidate = parseStructuredFields(JSON.parse(text))

    const usageMeta = result.response.usageMetadata
    const promptTokens = usageMeta?.promptTokenCount
    const completionTokens = usageMeta?.candidatesTokenCount

    return {
      candidate,
      provider: 'gemini',
      model: GEMINI_MODEL,
      latencyMs,
      usage: { promptTokens, completionTokens, estimatedCostUsd: estimateCostUsd(GEMINI_MODEL, promptTokens, completionTokens) },
    }
  }

  async validateQuestion(candidate: GeneratedQuestionStructured, blueprint: QuestionBlueprint): Promise<ValidateQuestionResult> {
    const start = Date.now()
    const model = client().getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: toGeminiSchema(SEMANTIC_VALIDATION_JSON_SCHEMA),
      },
    })

    const result = await withTimeout(model.generateContent(buildSemanticValidationPrompt(candidate, blueprint), { timeout: CALL_TIMEOUT_MS }), CALL_TIMEOUT_MS, 'Gemini validateQuestion')
    const latencyMs = Date.now() - start
    const parsed = JSON.parse(result.response.text()) as SemanticValidationResult

    const usageMeta = result.response.usageMetadata
    const promptTokens = usageMeta?.promptTokenCount
    const completionTokens = usageMeta?.candidatesTokenCount

    return {
      result: parsed,
      provider: 'gemini',
      model: GEMINI_MODEL,
      latencyMs,
      usage: { promptTokens, completionTokens, estimatedCostUsd: estimateCostUsd(GEMINI_MODEL, promptTokens, completionTokens) },
    }
  }

  async generateExplanation(input: { question: string; correctAnswer: string; ruleSummary: string }): Promise<ExplanationResult> {
    const start = Date.now()
    const model = client().getGenerativeModel({ model: GEMINI_MODEL })
    const result = await withTimeout(model.generateContent(
      `Explain in 2-4 sentences why "${input.correctAnswer}" is correct for this FAA question, grounded ONLY in the rule given.\n\nQUESTION: ${input.question}\nRULE: ${input.ruleSummary}`,
      { timeout: CALL_TIMEOUT_MS }
    ), CALL_TIMEOUT_MS, 'Gemini generateExplanation')
    const latencyMs = Date.now() - start
    const usageMeta = result.response.usageMetadata
    const promptTokens = usageMeta?.promptTokenCount
    const completionTokens = usageMeta?.candidatesTokenCount
    return {
      explanation: result.response.text(),
      provider: 'gemini',
      model: GEMINI_MODEL,
      latencyMs,
      usage: { promptTokens, completionTokens, estimatedCostUsd: estimateCostUsd(GEMINI_MODEL, promptTokens, completionTokens) },
    }
  }

  async analyzeFigure(): Promise<never> {
    throw new Error('analyzeFigure is not implemented in Phase 5 — reserved for the future figure/vision pipeline.')
  }
}
