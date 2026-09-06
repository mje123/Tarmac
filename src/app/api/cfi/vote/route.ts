import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { targetId, targetType } = await request.json() as { targetId: string; targetType: 'question' | 'answer' }
    if (!targetId || !targetType) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const admin = createAdminClient()
    const table = targetType === 'question' ? 'cfi_questions' : 'cfi_answers'

    const { data: existing } = await admin
      .from('cfi_votes')
      .select('id')
      .eq('target_id', targetId)
      .eq('user_id', user.id)
      .maybeSingle()

    const { data: target } = await admin.from(table).select('upvote_count').eq('id', targetId).single()
    const count = target?.upvote_count || 0

    if (existing) {
      await admin.from('cfi_votes').delete().eq('id', existing.id)
      await admin.from(table).update({ upvote_count: Math.max(0, count - 1) }).eq('id', targetId)
      return NextResponse.json({ voted: false })
    } else {
      await admin.from('cfi_votes').insert({ target_id: targetId, target_type: targetType, user_id: user.id })
      await admin.from(table).update({ upvote_count: count + 1 }).eq('id', targetId)
      return NextResponse.json({ voted: true })
    }
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
