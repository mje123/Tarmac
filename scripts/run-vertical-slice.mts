/**
 * Phase 5 vertical-slice runner: IRA -> atc_lost_comm_procedures -> blueprint -> AI
 * generation -> structured output -> validation -> database -> (admin review already
 * covered by the QuestionEngineTab UI). Exercises every available provider across
 * multiple generation modes and prints a report used for the Phase 5 deliverable.
 *
 * Run: npx tsx scripts/run-vertical-slice.ts
 */
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { generateAndValidateQuestion, runGenerationAttempt } from '../src/lib/ai/generate'
import { availableProviders } from '../src/lib/ai/providers'
import { createAdminClient } from '../src/lib/supabase/admin'
import type { ProviderName } from '../src/lib/ai/providers'

const CONCEPT_SLUG = 'atc_lost_comm_procedures' as const

interface Row {
  provider: string
  mode: string
  approved: boolean
  reason?: string
  detail?: string
  latencyMs: number
  promptTokens?: number
  completionTokens?: number
  estimatedCostUsd?: number
  questionId?: string
  questionText?: string
}

async function main() {
  const providers = availableProviders()
  console.log(`Available providers (API key present): ${providers.join(', ') || 'none'}`)
  for (const p of (['openai', 'gemini', 'anthropic'] as ProviderName[])) {
    if (!providers.includes(p)) console.log(`  SKIPPING ${p} — no API key configured in this environment`)
  }

  const rows: Row[] = []

  // 1. New Question — one attempt per available provider, single try (maxAttempts=1)
  //    so a rejection is visible in the report rather than silently retried away.
  for (const provider of providers) {
    const result = await runGenerationAttempt({ conceptSlug: CONCEPT_SLUG, provider, mode: 'new_question' })
    rows.push({
      provider, mode: 'new_question', approved: result.approved, reason: result.reason, detail: result.detail,
      latencyMs: result.latencyMs, promptTokens: result.promptTokens, completionTokens: result.completionTokens,
      estimatedCostUsd: result.estimatedCostUsd, questionId: result.questionId, questionText: result.candidate?.question,
    })
  }

  // 2. Novel Variant — same concept, told explicitly to avoid what's already there.
  for (const provider of providers) {
    const result = await runGenerationAttempt({ conceptSlug: CONCEPT_SLUG, provider, mode: 'novel_variant' })
    rows.push({
      provider, mode: 'novel_variant', approved: result.approved, reason: result.reason, detail: result.detail,
      latencyMs: result.latencyMs, promptTokens: result.promptTokens, completionTokens: result.completionTokens,
      estimatedCostUsd: result.estimatedCostUsd, questionId: result.questionId, questionText: result.candidate?.question,
    })
  }

  // 3. Prove It — force a different archetype than "application", proving concept stays
  //    locked while the reasoning path changes (spec section 7).
  const admin = createAdminClient()
  const { data: conceptRow } = await admin.from('concepts').select('id').eq('slug', CONCEPT_SLUG).single()
  const { data: appArchetype } = await admin
    .from('question_archetypes').select('id').eq('concept_id', conceptRow!.id).eq('scenario_type', 'application').single()

  for (const provider of providers) {
    const result = await runGenerationAttempt({
      conceptSlug: CONCEPT_SLUG, provider, mode: 'prove_it', excludeArchetypeId: appArchetype!.id,
    })
    rows.push({
      provider, mode: 'prove_it', approved: result.approved, reason: result.reason, detail: result.detail,
      latencyMs: result.latencyMs, promptTokens: result.promptTokens, completionTokens: result.completionTokens,
      estimatedCostUsd: result.estimatedCostUsd, questionId: result.questionId, questionText: result.candidate?.question,
    })
  }

  // 4. Retry-loop demo — generateAndValidateQuestion (up to 3 attempts) once, to show
  //    the full retry path rather than only single-attempt runs.
  if (providers.includes('openai')) {
    const result = await generateAndValidateQuestion({ conceptSlug: CONCEPT_SLUG, provider: 'openai', mode: 'weakness_attack' }, 3)
    rows.push({
      provider: 'openai', mode: 'weakness_attack (retry-loop)', approved: result.approved, reason: result.reason,
      detail: result.detail, latencyMs: result.latencyMs, promptTokens: result.promptTokens,
      completionTokens: result.completionTokens, estimatedCostUsd: result.estimatedCostUsd,
      questionId: result.questionId, questionText: result.candidate?.question,
    })
  }

  console.log('\n=== VERTICAL SLICE REPORT ===')
  console.log(`Concept: ${CONCEPT_SLUG}\n`)
  for (const r of rows) {
    console.log(`[${r.provider}] mode=${r.mode} approved=${r.approved} latency=${r.latencyMs}ms cost=${r.estimatedCostUsd?.toFixed(5) ?? 'n/a'} tokens=${r.promptTokens ?? '?'}/${r.completionTokens ?? '?'}`)
    if (r.approved) console.log(`   Q: ${r.questionText?.slice(0, 140)}...`)
    else console.log(`   REJECTED: ${r.reason} — ${r.detail}`)
  }

  const approvedRows = rows.filter(r => r.approved)
  console.log(`\nApproved: ${approvedRows.length} / ${rows.length} attempts`)

  // Fetch the actual DB rows for the approved ones to verify concept-lock + archetype
  // variety (Prove It safety, spec section 7) and check for accidental duplicates.
  const { data: dbRows } = await admin
    .from('questions')
    .select('id, question_text, concept_id, archetype_id, provider, generation_mode')
    .eq('concept_id', conceptRow!.id)
    .order('created_at', { ascending: false })
    .limit(rows.length + 5)

  const uniqueConcepts = new Set((dbRows || []).map(r => r.concept_id))
  const uniqueArchetypes = new Set((dbRows || []).map(r => r.archetype_id))
  console.log(`\nDB check — all approved rows share concept_id: ${uniqueConcepts.size === 1}`)
  console.log(`DB check — distinct archetype_ids represented: ${uniqueArchetypes.size}`)

  process.exit(0)
}

main().catch(err => {
  console.error('Vertical slice runner failed:', err)
  process.exit(1)
})
