import type { SupabaseClient } from '@supabase/supabase-js'

/** All test_sessions ids belonging to a user — the join key needed to filter
 *  test_answers by user, since test_answers itself has no user_id column. Shared by
 *  question-history exclusion (api/questions/random) and novelty/mastery checks
 *  (api/sessions/answer) so both use one consistent definition of "this user's answers". */
export async function getUserSessionIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data: sessions } = await supabase
    .from('test_sessions')
    .select('id')
    .eq('user_id', userId)
  return (sessions || []).map(s => s.id as string)
}
