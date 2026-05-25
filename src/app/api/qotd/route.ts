import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDailyQuestion } from '@/lib/question-pools'

export async function GET() {
  try {
    const admin = createAdminClient()
    const today = new Date().toISOString().slice(0, 10)

    const { data: post } = await admin
      .from('qotd_posts')
      .select('*')
      .eq('active_date', today)
      .maybeSingle()

    if (post) {
      return NextResponse.json({ post, date: today, auto: false })
    }

    // Auto-generate from pool
    const q = getDailyQuestion(today)
    return NextResponse.json({
      post: { id: `auto-${today}`, ...q, active_date: today },
      date: today,
      auto: true,
    })
  } catch (err) {
    console.error('QOTD error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
