import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateExamPDF } from '@/lib/pdfGenerator'
import { sendExamResultEmail } from '@/lib/emailService'
import { updateConceptMastery } from '@/lib/masteryUpdate'
import { classifyError } from '@/lib/spacedRepetition'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, answers, timeRemainingSeconds } = await request.json()

    const questionIds = answers.map((a: { questionId: string }) => a.questionId)
    const { data: questions } = await supabase
      .from('questions')
      .select('id, correct_answer, category, question_text, option_a, option_b, option_c, option_d, explanation, concept_id, scenario_type')
      .in('id', questionIds)

    const questionMap = new Map(questions?.map(q => [q.id, q]) || [])
    let score = 0
    const gradedAnswers = []
    const categoryStats: Record<string, { correct: number; total: number }> = {}

    for (const ans of answers) {
      const q = questionMap.get(ans.questionId)
      if (!q) continue
      const isCorrect = ans.answer === q.correct_answer
      if (isCorrect) score++

      gradedAnswers.push({ ...ans, isCorrect, question: q })

      if (!categoryStats[q.category]) categoryStats[q.category] = { correct: 0, total: 0 }
      categoryStats[q.category].total++
      if (isCorrect) categoryStats[q.category].correct++
    }

    await supabase.from('test_sessions').update({
      score,
      status: 'completed',
      completed_at: new Date().toISOString(),
      time_remaining_seconds: timeRemainingSeconds,
    }).eq('id', sessionId)

    // No confidence prompts in exam mode, so the confidence-dependent branches
    // (confidence_error/careless_error) never fire here — but calculation_error,
    // regulation_confusion, and the concept_gap/distractor_trap fallback still give
    // real signal, which previously went uncomputed entirely for every exam answer.
    const answerInserts = gradedAnswers.map(ans => {
      const errorTag = classifyError({
        isCorrect: ans.isCorrect,
        scenarioType: ans.question.scenario_type,
        confidence: null,
        category: ans.question.category,
      })
      return {
        session_id: sessionId,
        question_id: ans.questionId,
        user_answer: ans.answer,
        is_correct: ans.isCorrect,
        is_marked_for_review: ans.isMarked || false,
        answered_at: new Date().toISOString(),
        error_tag: errorTag,
        error_tag_source: errorTag ? 'heuristic' : null,
      }
    })

    if (answerInserts.length > 0) {
      await supabase.from('test_answers').insert(answerInserts)
    }

    // Exam attempts now feed concept_mastery too — previously only category-level
    // user_progress was updated here, so a student's readiness/mastery signal went
    // stale on exam day even though it's some of the highest-signal data available.
    // Confidence isn't collected in exam mode (no hints/confidence prompts, per spec),
    // and per-question novelty checks are skipped here (too many extra queries for a
    // 60-question submission) — novel-performance tracking stays primarily a
    // practice-mode signal.
    for (const ans of gradedAnswers) {
      const conceptId = ans.question?.concept_id as string | undefined
      if (conceptId) {
        await updateConceptMastery(supabase, user.id, conceptId, ans.isCorrect, null, false)
      }
    }

    for (const [category, stats] of Object.entries(categoryStats)) {
      const { data: existing } = await supabase
        .from('user_progress').select('*').eq('user_id', user.id).eq('category', category).single()

      if (existing) {
        const newAttempted = existing.questions_attempted + stats.total
        const newCorrect = existing.questions_correct + stats.correct
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
          category,
          questions_attempted: stats.total,
          questions_correct: stats.correct,
          accuracy_percentage: (stats.correct / stats.total) * 100,
          last_practiced: new Date().toISOString(),
        })
      }
    }

    // Send email report (non-blocking — don't fail the response if email fails)
    if (process.env.RESEND_API_KEY && answers.length >= 60) {
      try {
        const { data: userProfile } = await supabase
          .from('users').select('full_name, email').eq('id', user.id).single()

        const userName = userProfile?.full_name || 'Pilot'
        const userEmail = userProfile?.email || user.email || ''
        const pct = Math.round((score / answers.length) * 100)

        const optionLabel = (q: Record<string, string>, ans: string) => {
          const key = `option_${ans.toLowerCase()}` as keyof typeof q
          return `${ans}) ${q[key] ?? ans}`
        }

        const missedQuestions = gradedAnswers
          .filter(a => !a.isCorrect && a.question)
          .map(a => ({
            questionText: a.question.question_text,
            userAnswer: optionLabel(a.question, a.answer ?? '?'),
            correctAnswer: optionLabel(a.question, a.question.correct_answer),
            explanation: a.question.explanation || '',
            category: a.question.category,
          }))

        const catStats = Object.entries(categoryStats).map(([category, s]) => ({
          category,
          correct: s.correct,
          total: s.total,
          accuracy: (s.correct / s.total) * 100,
        })).sort((a, b) => a.accuracy - b.accuracy)

        const pdfBuffer = generateExamPDF({
          userName,
          userEmail,
          score,
          totalQuestions: answers.length,
          completedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          categoryStats: catStats,
          missedQuestions,
        })

        await sendExamResultEmail({
          toEmail: userEmail,
          userName,
          score,
          totalQuestions: answers.length,
          pct,
          passed: pct >= 70,
          pdfBuffer,
        })
      } catch (emailErr) {
        console.error('Email report failed (non-fatal):', emailErr)
      }
    }

    return NextResponse.json({ score, gradedAnswers: gradedAnswers.map(({ question: _q, ...rest }) => rest) })
  } catch (error) {
    console.error('Exam submit error:', error)
    return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 })
  }
}
