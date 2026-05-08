import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return null
  return supabase
}

// GET all posts with replies for admin
export async function GET() {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: posts } = await supabase
    .from('forum_posts')
    .select('id, title, category, author_name, is_pinned, is_resolved, reply_count, view_count, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  return NextResponse.json({ posts: posts || [] })
}

// POST for admin actions: delete_post, delete_reply, pin, unpin, resolve, unresolve
export async function POST(req: NextRequest) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, postId, replyId } = await req.json()

  if (action === 'delete_post') {
    const { error } = await supabase.from('forum_posts').delete().eq('id', postId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete_reply') {
    const { data: reply } = await supabase.from('forum_replies').select('post_id').eq('id', replyId).single()
    const { error } = await supabase.from('forum_replies').delete().eq('id', replyId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (reply?.post_id) {
      await supabase.from('forum_posts').update({ reply_count: supabase.rpc('decrement', { x: 1 }) }).eq('id', reply.post_id)
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'pin' || action === 'unpin') {
    const { error } = await supabase.from('forum_posts').update({ is_pinned: action === 'pin' }).eq('id', postId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'resolve' || action === 'unresolve') {
    const { error } = await supabase.from('forum_posts').update({ is_resolved: action === 'resolve' }).eq('id', postId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'get_replies') {
    const { data: replies } = await supabase
      .from('forum_replies')
      .select('id, author_name, body, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    return NextResponse.json({ replies: replies || [] })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
