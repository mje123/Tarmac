import type { SupabaseClient } from '@supabase/supabase-js'

export type ExamTypeValue = 'ppl' | 'ifr'

/**
 * Single source of truth for resolving a user's exam type server-side. Replaces the
 * old `profile?.is_admin && cookieVal === 'ifr' ? 'ifr' : 'ppl'` pattern that was
 * duplicated across ~7 files — that pattern silently forced every non-admin IFR
 * student back to PPL content on the Runway, readiness, practice home, and real exam
 * generation, regardless of what they actually selected. Precedence: an explicit
 * per-session cookie override (set by the sidebar Private/Instrument toggle) wins if
 * present; otherwise fall back to the durable `users.preferred_exam_type` set at
 * signup, so the choice survives a cleared cookie or a different device.
 */
export async function getEffectiveExamType(
  supabase: SupabaseClient,
  userId: string,
  cookieValue: string | undefined
): Promise<ExamTypeValue> {
  if (cookieValue === 'ppl' || cookieValue === 'ifr') return cookieValue

  const { data: profile } = await supabase
    .from('users')
    .select('preferred_exam_type')
    .eq('id', userId)
    .single()

  return profile?.preferred_exam_type === 'ifr' ? 'ifr' : 'ppl'
}
