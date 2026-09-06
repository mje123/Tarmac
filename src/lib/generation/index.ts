import { createAdminClient } from '@/lib/supabase/admin'
import { CONCEPTS, type ConceptSlug } from './concepts'
import { generateCandidate, GENERATOR_MODEL, PROMPT_VERSION } from './generate'
import { validateCandidate } from './validate'

const MAX_ATTEMPTS = 3

export interface GenerationOutcome {
  approved: boolean
  questionId?: string
  attempts: number
}

/**
 * Generates, validates, and (on success) stores ONE new question for a pilot
 * concept. This is the integration point called from the existing refill hook in
 * api/questions/random/route.ts for concepts in CONCEPTS — the legacy one-shot
 * generator (generation/legacy.ts) remains in place as the fallback content source
 * for any category not yet fully covered by a concept.
 *
 * Every attempt — approved or rejected — is written to question_generation_log so
 * admins can see exactly what was generated and why it was or wasn't shown to a
 * student. A student never sees an unapproved question.
 */
export async function generateValidatedQuestion(conceptSlug: ConceptSlug): Promise<GenerationOutcome> {
  const concept = CONCEPTS[conceptSlug]
  const admin = createAdminClient()

  const { data: conceptRow, error: conceptError } = await admin
    .from('concepts')
    .select('id')
    .eq('slug', conceptSlug)
    .single()

  if (conceptError || !conceptRow) {
    throw new Error(
      `Concept "${conceptSlug}" is not seeded in the concepts table. Run scripts/seed-concepts.js first. (${conceptError?.message})`
    )
  }
  const conceptId = conceptRow.id as string

  const { data: archetypeRows } = await admin
    .from('question_archetypes')
    .select('id, scenario_type, cognitive_level, template_prompt')
    .eq('concept_id', conceptId)

  if (!archetypeRows || archetypeRows.length === 0) {
    throw new Error(`No archetypes seeded for concept "${conceptSlug}". Run scripts/seed-concepts.js first.`)
  }

  const { data: recentRows } = await admin
    .from('questions')
    .select('concept_id, scenario_type, question_text, correct_answer')
    .eq('concept_id', conceptId)
    .order('created_at', { ascending: false })
    .limit(15)

  const recentQuestions = recentRows || []

  let attempts = 0
  while (attempts < MAX_ATTEMPTS) {
    attempts++
    const archetypeRow = archetypeRows[Math.floor(Math.random() * archetypeRows.length)]
    const archetype = concept.archetypes.find(a => a.scenarioType === archetypeRow.scenario_type) || concept.archetypes[0]

    let outcome: Awaited<ReturnType<typeof generateCandidate>> | null = null
    try {
      outcome = await generateCandidate(concept, archetype)
    } catch (err) {
      await admin.from('question_generation_log').insert({
        concept_id: conceptId,
        archetype_id: archetypeRow.id,
        model: GENERATOR_MODEL,
        prompt_version: PROMPT_VERSION,
        raw_output: null,
        validation_result: 'rejected',
        rejection_reason: `Generator error: ${err instanceof Error ? err.message : String(err)}`,
      })
      continue
    }

    const validation = await validateCandidate({
      candidate: outcome,
      concept,
      scenarioType: archetypeRow.scenario_type,
      recentQuestions,
    })

    await admin.from('question_generation_log').insert({
      concept_id: conceptId,
      archetype_id: archetypeRow.id,
      model: GENERATOR_MODEL,
      prompt_version: PROMPT_VERSION,
      raw_output: outcome,
      validation_result: validation.approved ? 'approved' : 'rejected',
      rejection_reason: validation.approved ? null : `${validation.reason}: ${validation.detail}`,
    })

    if (!validation.approved) continue

    const { data: inserted, error: insertError } = await admin
      .from('questions')
      .insert({
        question_text: outcome.question_text,
        option_a: outcome.option_a,
        option_b: outcome.option_b,
        option_c: outcome.option_c,
        option_d: '',
        correct_answer: outcome.correct_answer,
        category: concept.category,
        difficulty: archetype.cognitiveLevel === 'recall' || archetype.cognitiveLevel === 'application' ? 'medium' : 'hard',
        explanation: outcome.explanation,
        reference: concept.authoritativeSource,
        exam_type: concept.examType,
        concept_id: conceptId,
        archetype_id: archetypeRow.id,
        cognitive_level: archetype.cognitiveLevel,
        scenario_type: archetype.scenarioType,
        distractor_rationale: outcome.distractor_rationale,
        common_trap: outcome.common_trap,
        validation_status: 'approved',
        novelty_key: validation.noveltyKey,
      })
      .select('id')
      .single()

    if (insertError || !inserted) {
      throw new Error(`Validated question failed to insert: ${insertError?.message}`)
    }

    return { approved: true, questionId: inserted.id as string, attempts }
  }

  return { approved: false, attempts }
}
