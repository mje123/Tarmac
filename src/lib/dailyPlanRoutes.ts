import type { DailyPlanItem } from './runway'

/** Where each Test Runway daily-plan mode sends the student when they tap "Start
 *  Today's Training" on the Practice hub. Previously that CTA was hardcoded to
 *  /practice/practice?autoStart=weak regardless of the actual runway phase (QA audit
 *  issue 5) — e.g. a student in the 'diagnose' phase would be sent to Practice mode
 *  instead of the Diagnostic. Kept in its own module (rather than inline in the page)
 *  so this mapping can be unit-tested independently of Next.js server-page rendering. */
export const MODE_ROUTES: Record<DailyPlanItem['mode'], string> = {
  diagnostic: '/practice/diagnostic',
  learn: '/practice/learn',
  practice: '/practice/practice?autoStart=weak',
  transfer: '/practice/transfer',
  weakness: '/practice/weakness',
  exam: '/exam',
}

export function getModeRoute(mode: DailyPlanItem['mode']): string {
  return MODE_ROUTES[mode] ?? '/practice/practice?autoStart=weak'
}
