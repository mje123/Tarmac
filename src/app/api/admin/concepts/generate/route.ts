import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateValidatedQuestion } from '@/lib/generation'
import { CONCEPTS, type ConceptSlug } from '@/lib/generation/concepts'
import { generateAndValidateQuestion } from '@/lib/ai/generate'
import { isProviderAvailable, type ProviderName } from '@/lib/ai/providers'
import type { GenerationMode } from '@/lib/ai/blueprint'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

const VALID_PROVIDERS: ProviderName[] = ['openai', 'gemini', 'anthropic']
const VALID_MODES: GenerationMode[] = ['new_question', 'novel_variant', 'prove_it', 'weakness_attack', 'transfer']

// POST — manually trigger one generate→validate→(store) attempt for a concept, so an
// admin can see the pipeline work without waiting for the background low-pool refill
// in api/questions/random. Every attempt is logged to question_generation_log
// regardless of outcome — a rejection here is expected and useful information, not
// an error.
//
// Phase 5: an optional `provider` ('openai' | 'gemini' | 'anthropic') routes the
// request through the new provider-agnostic blueprint pipeline (lib/ai/generate.ts)
// instead of the original Anthropic-only one (lib/generation) — existing callers that
// don't pass `provider` are completely unaffected, so this stays backward compatible
// with the "Generate now" button's prior behavior.
export async function POST(request: NextRequest) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug, provider, mode } = await request.json().catch(() => ({}))
  if (!slug || !(slug in CONCEPTS)) {
    return NextResponse.json({ error: 'Unknown concept slug' }, { status: 400 })
  }

  try {
    if (provider) {
      if (!VALID_PROVIDERS.includes(provider)) {
        return NextResponse.json({ error: `provider must be one of ${VALID_PROVIDERS.join(', ')}` }, { status: 400 })
      }
      if (!isProviderAvailable(provider)) {
        return NextResponse.json({ error: `${provider} has no API key configured in this environment` }, { status: 400 })
      }
      const resolvedMode: GenerationMode = VALID_MODES.includes(mode) ? mode : 'new_question'
      const outcome = await generateAndValidateQuestion({ conceptSlug: slug as ConceptSlug, provider, mode: resolvedMode })
      return NextResponse.json({
        approved: outcome.approved,
        questionId: outcome.questionId,
        provider: outcome.provider,
        model: outcome.model,
        reason: outcome.reason,
        detail: outcome.detail,
        latencyMs: outcome.latencyMs,
        estimatedCostUsd: outcome.estimatedCostUsd,
      })
    }

    const outcome = await generateValidatedQuestion(slug as ConceptSlug)
    return NextResponse.json(outcome)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
