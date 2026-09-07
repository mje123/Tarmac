import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { JUDGE_MODEL } from '@/lib/generation/validate'
import type { ErrorTag } from '@/lib/spacedRepetition'

const BATCH_SIZE = 25

// Only the categories the heuristic can't reliably distinguish on its own — this cron
// runs exclusively on answers already bucketed as the catch-all 'concept_gap'.
// calculation_error and regulation_confusion are excluded because the heuristic in
// classifyError() rules those in before a wrong answer would ever reach 'concept_gap'.
const CANDIDATE_TAGS = [
  'concept_gap',
  'distractor_trap',
  'careless_error',
  'confidence_error',
  'figure_misread',
  'misread_question',
  'transfer_failure',
] as const

const TAG_DEFINITIONS = `
- concept_gap: the student does not understand the underlying rule or fact being tested.
- distractor_trap: the student fell for a specific plausible-but-wrong reasoning path represented by one of the wrong answer choices.
- careless_error: the student clearly understands the material (nothing about the mistake suggests a real gap) but slipped — misread a number, rushed, picked the wrong letter.
- confidence_error: the notable signal here is the mismatch between how sure the student was and whether they were right, more than the specific content mistake.
- figure_misread: the question involves a chart, diagram, or figure, and the mistake traces to misreading or misinterpreting it rather than the underlying rule.
- misread_question: the student appears to have answered a different question than the one actually asked (e.g. solved for the wrong variable, missed a qualifier like "NOT" or "EXCEPT").
- transfer_failure: the student understands the base concept in familiar form but failed to apply it once the scenario, wording, or numbers changed from what they're used to.
`

/**
 * Processes the pending_error_classifications queue: for each wrong answer the cheap
 * heuristic in classifyError() could only bucket as the catch-all 'concept_gap', asks
 * Haiku (the same judge model already used in generation/validate.ts) to pick the
 * real category from the residual set. Runs on a schedule (see vercel.json), not as an
 * in-request fire-and-forget call — a classification landing a few minutes late is
 * fine, silently losing one is not.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()

    const { data: pending } = await admin
      .from('pending_error_classifications')
      .select('id, test_answer_id')
      .is('processed_at', null)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (!pending || pending.length === 0) return NextResponse.json({ processed: 0 })

    const testAnswerIds = pending.map(p => p.test_answer_id as string)
    const { data: testAnswers } = await admin
      .from('test_answers')
      .select('id, question_id, user_answer')
      .in('id', testAnswerIds)

    const questionIds = [...new Set((testAnswers || []).map(a => a.question_id as string))]
    const { data: questions } = await admin
      .from('questions')
      .select('id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation')
      .in('id', questionIds)

    const answerById = new Map((testAnswers || []).map(a => [a.id as string, a]))
    const questionById = new Map((questions || []).map(q => [q.id as string, q]))
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

    let processed = 0
    for (const row of pending) {
      const answer = answerById.get(row.test_answer_id as string)
      const question = answer ? questionById.get(answer.question_id as string) : null

      // Nothing to classify against (deleted question/answer) — drain it from the
      // queue rather than retrying forever.
      if (!answer || !question) {
        await admin.from('pending_error_classifications').update({ processed_at: new Date().toISOString() }).eq('id', row.id)
        continue
      }

      try {
        const prompt = `A student answered an FAA written-test practice question incorrectly. Classify the most likely reason from this list:
${TAG_DEFINITIONS}
QUESTION: ${question.question_text}
A. ${question.option_a}
B. ${question.option_b}
C. ${question.option_c}
${question.option_d ? `D. ${question.option_d}\n` : ''}CORRECT ANSWER: ${question.correct_answer}
STUDENT ANSWERED: ${answer.user_answer}
EXPLANATION OF CORRECT ANSWER: ${question.explanation}

Return ONLY JSON: {"tag": "<one of ${CANDIDATE_TAGS.join(', ')}>"}`

        const response = await anthropic.messages.create({
          model: JUDGE_MODEL,
          max_tokens: 100,
          messages: [{ role: 'user', content: prompt }],
        })

        const text = response.content[0].type === 'text' ? response.content[0].text : ''
        const match = text.match(/\{[\s\S]*\}/)
        const parsed = match ? (JSON.parse(match[0]) as { tag?: string }) : null
        const tag = parsed?.tag && (CANDIDATE_TAGS as readonly string[]).includes(parsed.tag)
          ? (parsed.tag as ErrorTag)
          : null

        if (tag) {
          await admin.from('test_answers').update({ error_tag: tag, error_tag_source: 'ai' }).eq('id', row.test_answer_id)
        }
      } catch (err) {
        console.error('classify-errors: refinement failed for', row.id, err)
        // Leave unprocessed — picked up again next tick.
        continue
      }

      await admin.from('pending_error_classifications').update({ processed_at: new Date().toISOString() }).eq('id', row.id)
      processed++
    }

    return NextResponse.json({ processed })
  } catch (error) {
    console.error('classify-errors cron error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
