import type { SupabaseClient } from '@supabase/supabase-js'
import { computeRunwayState, generateDailyPlan, PHASE_SESSION_LABELS, type ConceptMasterySnapshot, type RunwayState, type DailyPlanItem } from './runway'

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface RunwayResult {
  runway: RunwayState
  examDate: string | null
  today: DailyPlanItem & { completed: boolean }
}

/** Shared by api/runway (client fetch) and the study-plan server page (direct call) —
 *  one place that owns "get or create the user's runway state + today's plan item"
 *  so the two callers can't drift into different logic. */
export async function getOrCreateRunway(supabase: SupabaseClient, userId: string, examType: 'ppl' | 'ifr'): Promise<RunwayResult> {
  let { data: state } = await supabase
    .from('study_plan_state')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!state) {
    const { data: created } = await supabase
      .from('study_plan_state')
      .insert({ user_id: userId })
      .select('*')
      .single()
    state = created
    if (!state) {
      // Lost a race with a concurrent first-visit request (e.g. Home and Study Plan
      // both rendering on first load) — the other insert won, so read its row instead
      // of trusting ours succeeded.
      const { data: refetched } = await supabase.from('study_plan_state').select('*').eq('user_id', userId).single()
      state = refetched
    }
  }
  if (!state) throw new Error('Failed to create or load study_plan_state')

  const planStartedAt = new Date(state!.plan_started_at)
  const examDate = state!.exam_date ? new Date(state!.exam_date) : null
  const runway = computeRunwayState(planStartedAt, examDate, new Date())

  if (runway.phase !== state!.current_phase || runway.dayIndex !== state!.day_index) {
    await supabase.from('study_plan_state').update({
      current_phase: runway.phase,
      day_index: runway.dayIndex,
      compressed: runway.compressed,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId)
  }

  const today = todayDateString()
  const { data: existingItem } = await supabase
    .from('daily_plan_items')
    .select('*')
    .eq('user_id', userId)
    .eq('plan_date', today)
    .single()

  let item = existingItem
  if (!item) {
    const { data: masteryRowsRaw } = await supabase
      .from('concept_mastery')
      .select('concept_id, attempts, correct, novel_attempts, novel_correct, next_review, concepts!inner(name, exam_type)')
      .eq('user_id', userId)
      .eq('concepts.exam_type', examType)

    type Row = { concept_id: string; attempts: number; correct: number; novel_attempts: number; novel_correct: number; next_review: string | null; concepts: { name: string } | { name: string }[] }
    const mastery: ConceptMasterySnapshot[] = ((masteryRowsRaw || []) as unknown as Row[]).map(r => ({
      concept_id: r.concept_id,
      concept_name: Array.isArray(r.concepts) ? r.concepts[0]?.name ?? '' : r.concepts?.name ?? '',
      attempts: r.attempts,
      correct: r.correct,
      novel_attempts: r.novel_attempts,
      novel_correct: r.novel_correct,
      next_review: r.next_review,
    }))

    const plan = generateDailyPlan(runway.phase, mastery, state!.daily_minutes_target ?? 20)
    const { data: inserted } = await supabase
      .from('daily_plan_items')
      .insert({
        user_id: userId,
        plan_date: today,
        phase: runway.phase,
        mode: plan.mode,
        concept_ids: plan.conceptIds,
        target_cognitive_level: plan.targetCognitiveLevel,
        estimated_minutes: plan.estimatedMinutes,
      })
      .select('*')
      .single()
    item = inserted
    if (!item) {
      // Same race as above, scoped to today's plan item (unique on user_id+plan_date).
      const { data: refetched } = await supabase
        .from('daily_plan_items')
        .select('*')
        .eq('user_id', userId)
        .eq('plan_date', today)
        .single()
      item = refetched
    }
  }
  if (!item) throw new Error('Failed to create or load daily_plan_items')

  return {
    runway,
    examDate: state!.exam_date,
    today: {
      mode: item.mode,
      conceptIds: item.concept_ids,
      targetCognitiveLevel: item.target_cognitive_level,
      estimatedMinutes: item.estimated_minutes,
      label: PHASE_SESSION_LABELS[runway.phase],
      completed: item.completed,
    },
  }
}
