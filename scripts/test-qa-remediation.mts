/**
 * Regression tests for the QA audit remediation pass (2026-09). One check per fixed
 * issue, guarding against each bug class recurring:
 *
 *  1. /api/sessions/answer computes isCorrect server-side and never trusts a
 *     client-supplied value.
 *  2/3. The shared submitAnswer() helper retries once on network failure and
 *     reports failure explicitly instead of silently losing the answer.
 *  2b. quiz/page.tsx's next() no longer fires a bare, unawaited fetch() for answer
 *     submission (the worst-offending call site — confirmed in production to drop
 *     data with zero error surfaced).
 *  4. practice/practice/page.tsx's top-level Suspense no longer falls back to a
 *     blank screen during hard-navigation hydration.
 *  5. The Practice hub's "Start Today's Training" CTA routes by the student's
 *     actual Test Runway mode instead of a hardcoded weak-practice link.
 *  7. Study Plan's per-phase "min/day" labels scale with the student's real
 *     daily_minutes_target instead of a fixed number for everyone.
 *
 * Source-guard checks (string/regex assertions against file contents) are used
 * where the fix lives inside a Next.js route handler or server component that
 * can't be exercised without a running server + authenticated request — the same
 * constraint noted for issue 1 in the audit. Pure-function fixes are behavior-
 * tested directly.
 *
 * Run: npx tsx scripts/test-qa-remediation.mts
 */
import { readFileSync } from 'fs'
import { join } from 'path'

import { getModeRoute } from '../src/lib/dailyPlanRoutes'
import { scaleDailyTime } from '../src/lib/studyPlanTime'

let pass = 0, fail = 0
function check(name: string, condition: boolean, detail?: string) {
  if (condition) { pass++; console.log(`PASS  ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

const ROOT = join(import.meta.dirname, '..')
function src(relPath: string): string {
  return readFileSync(join(ROOT, relPath), 'utf8')
}

// ── Issue 1: server-side correctness check ─────────────────────────────────────
{
  const routeSrc = src('src/app/api/sessions/answer/route.ts')
  const requestBodyLine = routeSrc.match(/const \{[^}]*\} = await request\.json\(\)/)?.[0] ?? ''
  check(
    'Issue 1: answer route no longer destructures isCorrect from the client request body',
    !/\bisCorrect\b/.test(requestBodyLine),
    `request body destructure was: ${requestBodyLine}`
  )
  check(
    'Issue 1: answer route recomputes isCorrect from the server-fetched correct_answer',
    /const isCorrect = answer === question\.correct_answer/.test(routeSrc)
  )
}

// ── Issues 2/3: shared submitAnswer() retry + failure surfacing ────────────────
{
  const originalFetch = global.fetch

  async function withMockedFetch(impl: typeof fetch, run: () => Promise<void>) {
    global.fetch = impl as typeof global.fetch
    try { await run() } finally { global.fetch = originalFetch }
  }

  const { submitAnswer } = await import('../src/lib/submitAnswer')

  await withMockedFetch(
    (async () => { throw new Error('network down') }) as typeof fetch,
    async () => {
      let calls = 0
      global.fetch = (async () => { calls++; throw new Error('network down') }) as typeof global.fetch
      const result = await submitAnswer({ sessionId: 's1', questionId: 'q1', answer: 'A' })
      check('Issues 2/3: submitAnswer retries once before giving up', calls === 2, `fetch called ${calls} times`)
      check('Issues 2/3: submitAnswer reports failure (ok: false) after both attempts fail', result.ok === false)
    }
  )

  await withMockedFetch(
    (async () => new Response('{}', { status: 500 })) as typeof fetch,
    async () => {
      let calls = 0
      global.fetch = (async () => { calls++; return new Response('{}', { status: 500 }) }) as typeof global.fetch
      const result = await submitAnswer({ sessionId: 's1', questionId: 'q1', answer: 'A' })
      check('Issues 2/3: submitAnswer retries once on a non-ok HTTP response', calls === 2, `fetch called ${calls} times`)
      check('Issues 2/3: submitAnswer reports failure for a persistent non-ok response', result.ok === false)
    }
  )

  await withMockedFetch(
    (async () => new Response('{}', { status: 500 })) as typeof fetch,
    async () => {
      let calls = 0
      global.fetch = (async () => {
        calls++
        if (calls === 1) return new Response('{}', { status: 500 })
        return new Response(JSON.stringify({ isCorrect: true }), { status: 200 })
      }) as typeof global.fetch
      const result = await submitAnswer({ sessionId: 's1', questionId: 'q1', answer: 'A' })
      check('Issues 2/3: submitAnswer succeeds if the retry lands', result.ok === true && result.isCorrect === true)
    }
  )
}

// ── Issue 2b: quiz mode's answer submission is awaited, not fire-and-forget ────
{
  const quizSrc = src('src/app/(dashboard)/quiz/page.tsx')
  check(
    'Issue 2b: quiz page no longer has a bare unawaited fetch(\'/api/sessions/answer\')',
    !/^\s*fetch\('\/api\/sessions\/answer'/m.test(quizSrc)
  )
  check(
    'Issue 2b: quiz page routes answer submission through the shared submitAnswer() helper',
    /submitAnswer\(\{[^)]*sessionId/.test(quizSrc)
  )
}

// ── Issue 4: Practice mode's Suspense fallback isn't a blank screen ────────────
{
  const practiceSrc = src('src/app/(dashboard)/practice/practice/page.tsx')
  check(
    'Issue 4: Practice page\'s outer Suspense no longer falls back to null on hard navigation',
    !/<Suspense fallback=\{null\}>/.test(practiceSrc)
  )
  check(
    'Issue 4: Practice page\'s Suspense fallback renders a visible loading indicator',
    /<Suspense fallback=\{[\s\S]*?Loader2[\s\S]*?\}>/.test(practiceSrc)
  )
}

// ── Issue 5: Practice hub CTA routes by actual runway mode ─────────────────────
{
  check('Issue 5: diagnose-phase mode routes to the Diagnostic', getModeRoute('diagnostic') === '/practice/diagnostic')
  check('Issue 5: build-phase mode routes to Learn', getModeRoute('learn') === '/practice/learn')
  check('Issue 5: apply-phase mode routes to Practice (weak-focused)', getModeRoute('practice') === '/practice/practice?autoStart=weak')
  check('Issue 5: transfer-phase mode routes to Transfer', getModeRoute('transfer') === '/practice/transfer')
  check('Issue 5: remediate-phase mode routes to Weakness Attack', getModeRoute('weakness') === '/practice/weakness')
  check('Issue 5: simulate/prove_it-phase mode routes to the Full Exam', getModeRoute('exam') === '/exam')

  const hubSrc = src('src/app/(dashboard)/practice/page.tsx')
  check(
    'Issue 5: Practice hub CTA no longer hardcodes the weak-practice link',
    !/href="\/practice\/practice\?autoStart=weak"/.test(hubSrc)
  )
  check(
    'Issue 5: Practice hub CTA is wired to the runway-derived route',
    /href=\{todayHref\}/.test(hubSrc)
  )
}

// ── Issue 7: Study Plan per-phase minutes scale with daily_minutes_target ──────
{
  check('Issue 7: default 20 min/day target leaves the baseline unchanged', scaleDailyTime(45, 20) === '45 min/day')
  check('Issue 7: a 10 min/day target scales phases down', scaleDailyTime(60, 10) === '30 min/day')
  check('Issue 7: a 40 min/day target scales phases up', scaleDailyTime(45, 40) === '90 min/day')
  check('Issue 7: an extreme low target is floored, never below 5 min/day', scaleDailyTime(45, 1) === '25 min/day', scaleDailyTime(45, 1))
  check('Issue 7: an extreme high target is capped at 2.5x scale', scaleDailyTime(45, 1000) === scaleDailyTime(45, 200))

  const studyPlanSrc = src('src/app/(dashboard)/study-plan/page.tsx')
  check(
    'Issue 7: Study Plan page no longer hardcodes "45 min/day" or "60 min/day" literals',
    !/dailyTime: '\d+ min\/day'/.test(studyPlanSrc)
  )
  check(
    'Issue 7: Study Plan page derives dailyTime from the user\'s real daily_minutes_target',
    /daily_minutes_target/.test(studyPlanSrc) && /scaleDailyTime\(/.test(studyPlanSrc)
  )
}

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
