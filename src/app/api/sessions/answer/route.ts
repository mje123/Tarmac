import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeNextInterval, classifyError, type ConfidenceLevel } from '@/lib/spacedRepetition'

const VALID_CONFIDENCE: ConfidenceLevel[] = ['very_confident', 'somewhat_confident', 'unsure', 'guessing']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, questionId, answer, isCorrect, confidence: rawConfidence } = await request.json()
    const confidence: ConfidenceLevel | null = VALID_CONFIDENCE.includes(rawConfidence) ? rawConfidence : null

    const { data: question } = await supabase
      .from('questions').select('category, concept_id, scenario_type').eq('id', questionId).single()

    const errorTag = question ? classifyError({ isCorrect, scenarioType: question.scenario_type, confidence }) : null

    await supabase.from('test_answers').insert({
      session_id: sessionId,
      question_id: questionId,
      user_answer: answer,
      is_correct: isCorrect,
      answered_at: new Date().toISOString(),
      confidence,
      error_tag: errorTag,
    })

    if (question) {
      const { data: existing } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', question.category)
        .single()

      if (existing) {
        const newAttempted = existing.questions_attempted + 1
        const newCorrect = existing.questions_correct + (isCorrect ? 1 : 0)
        await supabase.from('user_progress').update({
          questions_attempted: newAttempted,
          questions_correct: newCorrect,
          accuracy_percentage: (newCorrect / newAttempted) * 100,
          last_practiced: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id)
      } else {
        await supabase.from('user_progress').insert({
          user_id: user.id,
          category: question.category,
          questions_attempted: 1,
          questions_correct: isCorrect ? 1 : 0,
          accuracy_percentage: isCorrect ? 100 : 0,
          last_practiced: new Date().toISOString(),
        })
      }

      // Concept-level mastery signal — additive alongside user_progress. Scheduling
      // uses the same SM-2-style adaptive interval as srs_cards (see
      // spacedRepetition.ts) instead of a fixed 1/3-day offset, and tracks confidence
      // so a wrong-but-confident answer (the highest-priority misconception signal)
      // is distinguishable from a wrong guess. Only questions from the validated
      // concept pipeline carry a concept_id; legacy bank questions leave this untouched.
      if (question.concept_id) {
        const now = new Date()

        const { data: existingMastery } = await supabase
          .from('concept_mastery')
          .select('*')
          .eq('user_id', user.id)
          .eq('concept_id', question.concept_id)
          .single()

        const reps = existingMastery?.repetitions ?? 0
        const intervalDays = existingMastery?.interval_days ?? 1
        const ease = existingMastery?.ease_factor ?? 2.5
        const next = computeNextInterval(reps, intervalDays, ease, isCorrect)
        const nextReview = new Date(now.getTime() + next.interval * 24 * 60 * 60 * 1000)

        const isConfident = confidence === 'very_confident' || confidence === 'somewhat_confident'
        const confidenceDelta = confidence == null ? {} : isCorrect
          ? isConfident ? { confident_correct: 1 } : { guess_correct: 1 }
          : isConfident ? { confident_wrong: 1 } : { guess_wrong: 1 }

        if (existingMastery) {
          const updates: Record<string, unknown> = {
            attempts: existingMastery.attempts + 1,
            correct: existingMastery.correct + (isCorrect ? 1 : 0),
            last_seen: now.toISOString(),
            next_review: nextReview.toISOString(),
            ease_factor: next.ease,
            interval_days: next.interval,
            repetitions: next.reps,
            updated_at: now.toISOString(),
          }
          for (const [key, delta] of Object.entries(confidenceDelta)) {
            updates[key] = (existingMastery[key] ?? 0) + (delta as number)
          }
          await supabase.from('concept_mastery').update(updates).eq('id', existingMastery.id)
        } else {
          await supabase.from('concept_mastery').insert({
            user_id: user.id,
            concept_id: question.concept_id,
            attempts: 1,
            correct: isCorrect ? 1 : 0,
            last_seen: now.toISOString(),
            next_review: nextReview.toISOString(),
            ease_factor: next.ease,
            interval_days: next.interval,
            repetitions: next.reps,
            ...confidenceDelta,
          })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Answer submit error:', error)
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 })
  }
}
