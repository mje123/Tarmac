import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeRunwayState } from '@/lib/runway'

/** Keeps study_plan_state.current_phase/day_index fresh for users who haven't visited
 *  today — the runway API route recomputes this live on visit regardless, so this
 *  cron isn't a correctness dependency, just keeps stored state current for anything
 *  that reads it without hitting the live endpoint (future phase-change notifications). */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()
    const { data: states } = await admin.from('study_plan_state').select('*')
    const now = new Date()

    let updated = 0
    for (const state of states || []) {
      const runway = computeRunwayState(
        new Date(state.plan_started_at as string),
        state.exam_date ? new Date(state.exam_date as string) : null,
        now
      )
      if (runway.phase !== state.current_phase || runway.dayIndex !== state.day_index) {
        await admin.from('study_plan_state').update({
          current_phase: runway.phase,
          day_index: runway.dayIndex,
          compressed: runway.compressed,
          updated_at: now.toISOString(),
        }).eq('user_id', state.user_id)
        updated++
      }
    }

    return NextResponse.json({ updated, total: states?.length ?? 0 })
  } catch (error) {
    console.error('runway-advance cron error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
