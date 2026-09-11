// Blueprint-first generation (Phase 5, spec section 3). The model never chooses what
// concept or reasoning shape to test — Tarmac decides that here, from the verified
// concept layer in generation/concepts.ts, and hands the model a fully-specified brief.
// If the concept isn't seeded, building a blueprint fails loudly rather than falling
// back to letting the model invent the rule (spec section 4).

import { createAdminClient } from '@/lib/supabase/admin'
import { CONCEPTS, type ConceptDefinition, type ConceptArchetype, type ConceptSlug } from '../generation/concepts'

export type GenerationMode = 'new_question' | 'novel_variant' | 'prove_it' | 'weakness_attack' | 'transfer'

export interface QuestionBlueprint {
  conceptSlug: ConceptSlug
  conceptId: string
  exam: 'ppl' | 'ifr'
  category: string
  acsArea: string
  acsTask: string
  conceptName: string
  source: string
  ruleSummary: string
  commonMisconceptions: string
  requiredVariables: string[]
  numeric: ConceptDefinition['numeric']
  archetypeId: string
  scenarioType: string
  cognitiveLevel: ConceptArchetype['cognitiveLevel']
  requiredReasoningPath: string
  difficulty: 'easy' | 'medium' | 'hard'
  figureRequired: boolean
  mode: GenerationMode
  /** Short summaries of recent questions on this exact concept, given to the generator
   *  so it actively avoids repeating them — not just checked post-hoc (see novelty.ts,
   *  which remains the authoritative accept/reject gate regardless of what the model
   *  does with this hint). */
  avoidSimilarTo: string[]
  /** For 'prove_it': the archetype id the student just answered — the blueprint's own
   *  archetype above is chosen to differ from it (spec section 7: concept stays fixed,
   *  reasoning path must change). */
  proveItAgainstArchetypeId?: string
}

function difficultyForCognitiveLevel(level: ConceptArchetype['cognitiveLevel']): 'easy' | 'medium' | 'hard' {
  if (level === 'recall') return 'easy'
  if (level === 'application') return 'medium'
  return 'hard'
}

export interface BuildBlueprintOptions {
  mode: GenerationMode
  /** Pin a specific archetype (required for 'prove_it' — must differ from the one the
   *  student just saw). Random pick among the concept's archetypes otherwise. */
  archetypeScenarioType?: string
  /** 'prove_it' only: the archetype id just answered, excluded from selection. */
  excludeArchetypeId?: string
}

/**
 * Loads the concept + a chosen archetype from the DB (never trusts in-memory
 * concepts.ts alone — the seeded row is what generation/index.ts and every other
 * caller treats as the source of truth) and packages everything the generator needs
 * into one typed blueprint. Throws if the concept or its archetypes aren't seeded —
 * per spec section 4, missing source evidence must fail generation, not silently
 * fall back to model knowledge.
 */
export async function buildBlueprint(conceptSlug: ConceptSlug, options: BuildBlueprintOptions): Promise<QuestionBlueprint> {
  const concept = CONCEPTS[conceptSlug]
  if (!concept) throw new Error(`Unknown concept slug "${conceptSlug}" — not defined in generation/concepts.ts`)

  const admin = createAdminClient()

  const { data: conceptRow, error: conceptError } = await admin
    .from('concepts')
    .select('id')
    .eq('slug', conceptSlug)
    .single()
  if (conceptError || !conceptRow) {
    throw new Error(`Concept "${conceptSlug}" is not seeded in the concepts table — run scripts/seed-concepts.js first. (${conceptError?.message})`)
  }

  const { data: archetypeRows, error: archetypeError } = await admin
    .from('question_archetypes')
    .select('id, scenario_type, cognitive_level, template_prompt')
    .eq('concept_id', conceptRow.id)
  if (archetypeError || !archetypeRows || archetypeRows.length === 0) {
    throw new Error(`No archetypes seeded for concept "${conceptSlug}" — run scripts/seed-concepts.js first. (${archetypeError?.message})`)
  }

  let candidates = archetypeRows
  if (options.excludeArchetypeId) {
    const filtered = candidates.filter(a => a.id !== options.excludeArchetypeId)
    // If excluding leaves nothing (a concept with only one archetype), Prove It has no
    // valid alternative reasoning path — the caller must treat this as unavailable
    // rather than silently reusing the same archetype under a different label.
    if (filtered.length === 0) {
      throw new Error(`Concept "${conceptSlug}" has no alternative archetype — Prove It is unavailable for this concept.`)
    }
    candidates = filtered
  }
  if (options.archetypeScenarioType) {
    const matched = candidates.filter(a => a.scenario_type === options.archetypeScenarioType)
    if (matched.length > 0) candidates = matched
  }

  const archetypeRow = candidates[Math.floor(Math.random() * candidates.length)]
  const archetype =
    concept.archetypes.find(a => a.scenarioType === archetypeRow.scenario_type) || concept.archetypes[0]

  const { data: recentRows } = await admin
    .from('questions')
    .select('question_text')
    .eq('concept_id', conceptRow.id)
    .order('created_at', { ascending: false })
    .limit(8)

  return {
    conceptSlug,
    conceptId: conceptRow.id as string,
    exam: concept.examType,
    category: concept.category,
    acsArea: concept.acsArea,
    acsTask: concept.acsTask,
    conceptName: concept.name,
    source: concept.authoritativeSource,
    ruleSummary: concept.ruleSummary,
    commonMisconceptions: concept.commonMisconceptions,
    requiredVariables: concept.variables,
    numeric: concept.numeric,
    archetypeId: archetypeRow.id as string,
    scenarioType: archetypeRow.scenario_type as string,
    cognitiveLevel: archetypeRow.cognitive_level as ConceptArchetype['cognitiveLevel'],
    requiredReasoningPath: archetypeRow.template_prompt as string,
    difficulty: difficultyForCognitiveLevel(archetypeRow.cognitive_level as ConceptArchetype['cognitiveLevel']),
    figureRequired: false, // no concept currently requires a figure — see AGENTS Phase-5 rule 11
    mode: options.mode,
    avoidSimilarTo: (recentRows || []).map(r => String(r.question_text)).slice(0, 5),
    proveItAgainstArchetypeId: options.excludeArchetypeId,
  }
}
