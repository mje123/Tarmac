// Orchestration entry point for the Phase 5 provider-agnostic pipeline:
// blueprint -> provider.generateQuestion -> validate.ts -> log -> (insert if approved).
// This is deliberately a SEPARATE path from generation/index.ts (the live Anthropic-only
// pipeline currently wired into the production refill hook in api/questions/random) —
// Phase 5 builds and proves this architecture on one concept before anything switches
// over to it, per the spec's "do not begin large-scale generation until approved."

import { createAdminClient } from '@/lib/supabase/admin'
import type { ConceptSlug } from '../generation/concepts'
import { buildBlueprint, type GenerationMode, type QuestionBlueprint } from './blueprint'
import { getProvider, type ProviderName } from './providers'
import { validateCandidate } from './validate'
import { PROMPT_VERSION } from './prompts'
import type { GeneratedQuestionStructured } from './schema'

export interface GenerationAttemptResult {
  approved: boolean
  questionId?: string
  provider: ProviderName
  model: string
  reason?: string
  detail?: string
  latencyMs: number
  promptTokens?: number
  completionTokens?: number
  estimatedCostUsd?: number
  blueprint: QuestionBlueprint
  candidate?: GeneratedQuestionStructured
}

export interface GenerateAndValidateOptions {
  conceptSlug: ConceptSlug
  provider: ProviderName
  mode: GenerationMode
  archetypeScenarioType?: string
  excludeArchetypeId?: string
}

/** One full attempt: builds a fresh blueprint, generates ONE candidate, validates it,
 *  logs the attempt unconditionally, and inserts into `questions` only if approved.
 *  Never throws for a generation/validation failure (that's a normal rejected outcome,
 *  logged and returned) — only for setup errors (unseeded concept, missing provider
 *  key), which should surface loudly rather than be swallowed. */
export async function runGenerationAttempt(options: GenerateAndValidateOptions): Promise<GenerationAttemptResult> {
  const admin = createAdminClient()
  const provider = getProvider(options.provider) // throws if the provider's key isn't configured

  const blueprint = await buildBlueprint(options.conceptSlug, {
    mode: options.mode,
    archetypeScenarioType: options.archetypeScenarioType,
    excludeArchetypeId: options.excludeArchetypeId,
  })

  const { data: recentRows } = await admin
    .from('questions')
    .select('concept_id, scenario_type, question_text, correct_answer')
    .eq('concept_id', blueprint.conceptId)
    .order('created_at', { ascending: false })
    .limit(15)

  let genResult
  try {
    genResult = await provider.generateQuestion(blueprint)
  } catch (err) {
    await admin.from('question_generation_log').insert({
      concept_id: blueprint.conceptId,
      archetype_id: blueprint.archetypeId,
      model: options.provider,
      prompt_version: PROMPT_VERSION,
      provider: options.provider,
      mode: options.mode,
      blueprint,
      raw_output: null,
      validation_result: 'rejected',
      rejection_reason: `Generator error: ${err instanceof Error ? err.message : String(err)}`,
    })
    return {
      approved: false, provider: options.provider, model: 'unknown', reason: 'provider_error',
      detail: err instanceof Error ? err.message : String(err), latencyMs: 0, blueprint,
    }
  }

  const validation = await validateCandidate({
    candidate: genResult.candidate,
    blueprint,
    provider,
    recentQuestions: recentRows || [],
  })

  const totalLatencyMs = genResult.latencyMs + (validation.semanticCall?.latencyMs ?? 0)
  const totalCost = (genResult.usage.estimatedCostUsd ?? 0) + (validation.semanticCall?.usage.estimatedCostUsd ?? 0)

  await admin.from('question_generation_log').insert({
    concept_id: blueprint.conceptId,
    archetype_id: blueprint.archetypeId,
    model: genResult.model,
    prompt_version: PROMPT_VERSION,
    provider: genResult.provider,
    model_version: genResult.model,
    mode: options.mode,
    blueprint,
    raw_output: genResult.candidate,
    semantic_validation: validation.semanticValidation ?? null,
    validation_result: validation.approved ? 'approved' : 'rejected',
    rejection_reason: validation.approved ? null : `${validation.reason}: ${validation.detail}`,
    prompt_tokens: genResult.usage.promptTokens ?? null,
    completion_tokens: genResult.usage.completionTokens ?? null,
    latency_ms: totalLatencyMs,
    estimated_cost_usd: totalCost || null,
  })

  if (!validation.approved) {
    return {
      approved: false, provider: genResult.provider, model: genResult.model,
      reason: validation.reason, detail: validation.detail, latencyMs: totalLatencyMs,
      promptTokens: genResult.usage.promptTokens, completionTokens: genResult.usage.completionTokens,
      estimatedCostUsd: totalCost, blueprint, candidate: genResult.candidate,
    }
  }

  const { data: inserted, error: insertError } = await admin
    .from('questions')
    .insert({
      question_text: genResult.candidate.question,
      option_a: genResult.candidate.choices.A,
      option_b: genResult.candidate.choices.B,
      option_c: genResult.candidate.choices.C,
      option_d: '',
      correct_answer: genResult.candidate.correct_answer,
      category: blueprint.category,
      difficulty: genResult.candidate.difficulty,
      explanation: genResult.candidate.explanation,
      reference: blueprint.source,
      source_reference: genResult.candidate.source_reference,
      exam_type: blueprint.exam,
      concept_id: blueprint.conceptId,
      archetype_id: blueprint.archetypeId,
      cognitive_level: blueprint.cognitiveLevel,
      scenario_type: blueprint.scenarioType,
      distractor_rationale: genResult.candidate.distractor_rationale,
      common_trap: genResult.candidate.common_trap,
      variables_used: genResult.candidate.variables,
      figure_required: genResult.candidate.figure_required,
      figure_type: genResult.candidate.figure_type,
      figure_source: genResult.candidate.figure_source,
      visual_concept: genResult.candidate.visual_concept,
      generation_mode: options.mode,
      provider: genResult.provider,
      model_version: genResult.model,
      validation_status: 'approved',
      novelty_key: validation.noveltyKey,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    throw new Error(`Validated question failed to insert: ${insertError?.message}`)
  }

  return {
    approved: true, questionId: inserted.id as string, provider: genResult.provider, model: genResult.model,
    latencyMs: totalLatencyMs, promptTokens: genResult.usage.promptTokens, completionTokens: genResult.usage.completionTokens,
    estimatedCostUsd: totalCost, blueprint, candidate: genResult.candidate,
  }
}

/** Retries up to MAX_ATTEMPTS on rejection (a fresh blueprint/candidate each time —
 *  never retries by re-validating the same rejected candidate). Returns the LAST
 *  attempt's result whether it approved or not; every attempt in between is still
 *  logged by runGenerationAttempt regardless of which one this function returns. */
export async function generateAndValidateQuestion(options: GenerateAndValidateOptions, maxAttempts = 3): Promise<GenerationAttemptResult> {
  let last: GenerationAttemptResult | null = null
  for (let i = 0; i < maxAttempts; i++) {
    last = await runGenerationAttempt(options)
    if (last.approved) return last
  }
  return last!
}
