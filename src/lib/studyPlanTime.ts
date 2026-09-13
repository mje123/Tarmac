/** Scales a week's baseline minutes/day (set at the product default of 20 min/day —
 *  see runway.ts's own scale() for the same normalization) by the student's real
 *  daily_minutes_target. Previously the Study Plan page's per-phase "min/day" labels
 *  were hardcoded strings shown identically to every student regardless of what they
 *  configured (QA audit issue 7). Kept in its own module so the scaling math can be
 *  unit-tested independently of Next.js server-page rendering. */
export function scaleDailyTime(baseMinutes: number, dailyMinutesTarget: number): string {
  const scale = Math.max(0.5, Math.min(2.5, dailyMinutesTarget / 20))
  const minutes = Math.max(5, Math.round((baseMinutes * scale) / 5) * 5)
  return `${minutes} min/day`
}
