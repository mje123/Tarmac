import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const admin = createAdminClient()
    const today = new Date().toISOString().slice(0, 10)

    // Try to get an admin-created QOTD post for today first
    const { data: post } = await admin
      .from('qotd_posts')
      .select('*')
      .eq('active_date', today)
      .maybeSingle()

    if (post) {
      return NextResponse.json(
        { post, date: today },
        { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } }
      )
    }

    return NextResponse.json({ post: null, date: today })
  } catch (err) {
    console.error('QOTD error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
