import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { commentId } = await request.json() as { commentId: string }
    if (!commentId) return NextResponse.json({ error: 'Missing commentId' }, { status: 400 })

    const admin = createAdminClient()

    // Toggle: check if vote exists
    const { data: existing } = await admin
      .from('accident_votes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      await admin.from('accident_votes').delete().eq('id', existing.id)
      await admin.from('accident_comments').update({ upvote_count: admin.rpc ? undefined : 0 }).eq('id', commentId)
      // Decrement
      await admin.rpc('decrement_accident_upvotes', { comment_id: commentId }).catch(async () => {
        const { data: c } = await admin.from('accident_comments').select('upvote_count').eq('id', commentId).single()
        await admin.from('accident_comments').update({ upvote_count: Math.max(0, (c?.upvote_count || 1) - 1) }).eq('id', commentId)
      })
      return NextResponse.json({ voted: false })
    } else {
      await admin.from('accident_votes').insert({ comment_id: commentId, user_id: user.id })
      // Increment
      const { data: c } = await admin.from('accident_comments').select('upvote_count').eq('id', commentId).single()
      await admin.from('accident_comments').update({ upvote_count: (c?.upvote_count || 0) + 1 }).eq('id', commentId)
      return NextResponse.json({ voted: true })
    }
  } catch (err) {
    console.error('Vote error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
