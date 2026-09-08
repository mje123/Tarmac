import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { classifyError, type ConfidenceLevel } from '@/lib/spacedRepetition'
import { updateConceptMastery } from '@/lib/masteryUpdate'
import { isQuestionNovelForUser } from '@/lib/novelQuestion'
import { getUserSessionIds } from '@/lib/userSessions'

const VALID_CONFIDENCE: ConfidenceLevel[] = ['very_confident', 'somewhat_confident', 'unsure', 'guessing']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, questionId, answer, isCorrect, confidence: rawConfidence } = await request.json()
    const confidence: ConfidenceLevel | null = VALID_CONFIDENCE.includes(rawConfidence) ? rawConfidence : null

    const { data: question } = await supabase
      .from('questions')
      .select('category, concept_id, scenario_type, archetype_id, cognitive_level, novelty_key')
      .eq('id', questionId)
      .single()

    let errorTag: ReturnType<typeof classifyError> = null
    let errorTagSource: 'heuristic' | 'ai' | null = null
    let isNovel = false
    let priorAccuracy: number | null = null

    if (question) {
      const sessionIds = await getUserSessionIds(supabase, user.id)
      isNovel = await isQuestionNovelForUser(supabase, sessionIds, {
        concept_id: question.concept_id,
        archetype_id: question.archetype_id,
        cognitive_level: question.cognitive_level,
        novelty_key: question.novelty_key,
      })

      if (question.concept_id) {
        const { data: existingMastery } = await supabase
          .from('concept_mastery')
          .select('correct, attempts')
          .eq('user_id', user.id)
          .eq('concept_id', question.concept_id)
          .single()
        priorAccuracy = existingMastery && existingMastery.attempts > 0
          ? existingMastery.correct / existingMastery.attempts
          : null
      }

      errorTag = classifyError({
        isCorrect,
        scenarioType: question.scenario_type,
        confidence,
        category: question.category,
        priorAccuracy,
      })
      errorTagSource = errorTag ? 'heuristic' : null
    }

    const { data: insertedAnswer } = await supabase.from('test_answers').insert({
      session_id: sessionId,
      question_id: questionId,
      user_answer: answer,
      is_correct: isCorrect,
      answered_at: new Date().toISOString(),
      confidence,
      error_tag: errorTag,
      error_tag_source: errorTagSource,
    }).select('id').single()

    // The heuristic's catch-all bucket gets queued for async AI refinement (figure
    // misreads, misread questions, and transfer failures need real judgment) — a
    // reliable DB-queue write, not a fire-and-forget promise a serverless function
    // could kill mid-flight. Processed by cron/classify-errors. concept_id is stored
    // when available but not required — the classifier only needs the question's own
    // text/options/explanation, so legacy (non-concept) questions get refined too.
    if (errorTag === 'concept_gap' && insertedAnswer) {
      await supabase.from('pending_error_classifications').insert({
        test_answer_id: insertedAnswer.id,
        concept_id: question?.concept_id ?? null,
      })
    }

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

      // Concept-level mastery signal — additive alongside user_progress. Only
      // questions from the validated concept pipeline carry a concept_id; legacy bank
      // questions leave this untouched. See lib/masteryUpdate.ts for the scheduling +
      // confidence + novelty-counter logic shared with api/srs/review.
      if (question.concept_id) {
        await updateConceptMastery(supabase, user.id, question.concept_id, isCorrect, confidence, isNovel)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Answer submit error:', error)
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 })
  }
}
