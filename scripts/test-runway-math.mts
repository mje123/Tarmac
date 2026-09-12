/**
 * Behavior tests for the Test Runway's adaptive-length math (spec section 29, cases
 * A-E and H). computeRunwayState is a pure function — no DB, no network — so these
 * run instantly and test actual behavior, not just "it compiles."
 *
 * Run: npx tsx scripts/test-runway-math.mts
 */
import { computeRunwayState } from '../src/lib/runway'

let pass = 0, fail = 0
function check(name: string, condition: boolean, detail?: string) {
  if (condition) { pass++; console.log(`PASS  ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

const today = new Date(2026, 0, 1) // Jan 1, 2026 — fixed so results are reproducible
function daysFromToday(n: number): Date {
  return new Date(2026, 0, 1 + n)
}

// A. No exam date -> 30-day default
{
  const r = computeRunwayState(today, null, today)
  check('A: no exam date defaults to a 30-day runway', r.totalDays === 30, `got ${r.totalDays}`)
  check('A: no exam date is not flagged compressed', r.compressed === false)
}

// B. Exam date 14 days away -> 14-day runway
{
  const r = computeRunwayState(today, daysFromToday(13), today) // +1 inclusive-day convention in computeRunwayState
  check('B: exam 14 days out gives a 14-day runway', r.totalDays === 14, `got ${r.totalDays}`)
  check('B: a runway shorter than 30 is flagged compressed', r.compressed === true)
}

// C. Exam date 30 days away -> 30-day runway
{
  const r = computeRunwayState(today, daysFromToday(29), today)
  check('C: exam 30 days out gives a 30-day runway', r.totalDays === 30, `got ${r.totalDays}`)
}

// D. Exam date 45 days away -> 45-day runway (the actual bug this session fixed —
//    the old code capped every dated runway at 30 regardless of how far out it was)
{
  const r = computeRunwayState(today, daysFromToday(44), today)
  check('D: exam 45 days out gives a 45-day runway, not capped at 30', r.totalDays === 45, `got ${r.totalDays}`)
}

// Also verify 37/60-day examples named explicitly in the spec
{
  const r37 = computeRunwayState(today, daysFromToday(36), today)
  const r60 = computeRunwayState(today, daysFromToday(59), today)
  check('37-day exam gives a 37-day runway', r37.totalDays === 37, `got ${r37.totalDays}`)
  check('60-day exam gives a 60-day runway', r60.totalDays === 60, `got ${r60.totalDays}`)
}

// E. Exam date 3 days away -> compressed plan, no crash, valid phase
{
  const r = computeRunwayState(today, daysFromToday(2), today)
  check('E: exam 3 days out gives a 3-day runway (the minimum floor)', r.totalDays === 3, `got ${r.totalDays}`)
  check('E: 3-day runway does not crash and returns a valid phase', typeof r.phase === 'string' && r.phase.length > 0)
  check('E: 3-day runway is flagged compressed', r.compressed === true)
}

// Exam date literally today/tomorrow (edge case beyond the spec's own examples) —
// must still return a valid, non-crashing state at the 3-day floor.
{
  const r = computeRunwayState(today, today, today)
  check('exam date = today does not crash, floors to 3-day minimum', r.totalDays === 3 && Number.isFinite(r.dayIndex))
}

// H. Missed sessions do not create an impossible backlog — dayIndex is always
//    calendar-derived and clamped to totalDays, never an accumulating counter of
//    "sessions owed." Simulating a student who set a 14-day runway and then didn't
//    open the app for 40 days.
{
  const examDate = daysFromToday(13)
  const wayLater = daysFromToday(40)
  const r = computeRunwayState(today, examDate, wayLater)
  check('H: missed weeks clamp dayIndex to totalDays instead of overflowing', r.dayIndex === r.totalDays, `dayIndex=${r.dayIndex} totalDays=${r.totalDays}`)
  check('H: the student lands on the final phase, not an error state', r.phase === 'prove_it', `got phase=${r.phase}`)
}

// Sanity ceiling — a mistyped far-future date shouldn't produce a multi-year plan.
{
  const r = computeRunwayState(today, daysFromToday(1000), today)
  check('a pathologically distant exam date is clamped to the sanity ceiling (180d)', r.totalDays === 180, `got ${r.totalDays}`)
}

// F (partial, pure-math slice) — changing the exam date changes the SAME function's
// output on the next call with no other state needed, which is exactly what
// api/runway's POST handler relies on (see runwayServer.ts: state is always
// recomputed live, never cached as truth).
{
  const originalExam = daysFromToday(29) // 30-day runway
  const movedCloserExam = daysFromToday(9) // moved to 10 days out
  const before = computeRunwayState(today, originalExam, today)
  const after = computeRunwayState(today, movedCloserExam, today)
  check('F: moving the exam date closer recalculates a shorter runway', before.totalDays === 30 && after.totalDays === 10, `before=${before.totalDays} after=${after.totalDays}`)
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail > 0 ? 1 : 0)
