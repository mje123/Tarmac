'use client'

export interface SubmitAnswerParams {
  sessionId: string
  questionId: string
  answer: string
  confidence?: string | null
}

export interface SubmitAnswerResult {
  ok: boolean
  isCorrect?: boolean
}

/**
 * Posts one answer to /api/sessions/answer with a single retry on failure. Every
 * practice mode's answer submission goes through this now — previously each page
 * called fetch() directly with no error handling and, in one case (quiz mode), without
 * even awaiting it. Confirmed in production: a full 12-question diagnostic run
 * produced only 11 rows in test_answers — one submission silently vanished with the
 * student never told anything went wrong. Server-computed `isCorrect` is returned so
 * callers never need to trust their own client-side correctness check for anything
 * beyond instant UI feedback.
 */
export async function submitAnswer(params: SubmitAnswerParams): Promise<SubmitAnswerResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/sessions/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        return { ok: true, isCorrect: data.isCorrect }
      }
    } catch {
      // Network error — fall through and retry once before giving up.
    }
  }
  return { ok: false }
}
