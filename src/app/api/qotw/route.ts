import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWeeklyQuestion, getCurrentWeekStartStr } from '@/lib/question-pools'

export async function GET() {
  try {
    const admin = createAdminClient()
    const weekStart = getCurrentWeekStartStr()

    const { data: post } = await admin
      .from('qotw_posts')
      .select('*')
      .eq('week_start', weekStart)
      .maybeSingle()

    if (post) {
      const weekEnd = new Date(weekStart + 'T00:00:00Z')
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)
      return NextResponse.json({ post, weekStart, weekEnd: weekEnd.toISOString().slice(0, 10), auto: false })
    }

    const q = getWeeklyQuestion(weekStart)
    const weekEnd = new Date(weekStart + 'T00:00:00Z')
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)

    return NextResponse.json({
      post: { id: `auto-${weekStart}`, ...q, week_start: weekStart },
      weekStart,
      weekEnd: weekEnd.toISOString().slice(0, 10),
      auto: true,
    })
  } catch (err) {
    console.error('QOTW error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
