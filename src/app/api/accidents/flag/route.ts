import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { commentId, reason } = await request.json() as { commentId: string; reason: string }
    if (!commentId) return NextResponse.json({ error: 'Missing commentId' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin.from('accident_flags').insert({
      comment_id: commentId,
      user_id: user.id,
      reason: reason || 'Other',
    })

    if (error?.code === '23505') return NextResponse.json({ error: 'Already flagged' }, { status: 409 })
    if (error) return NextResponse.json({ error: 'Flag failed' }, { status: 500 })
    return NextResponse.json({ flagged: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
