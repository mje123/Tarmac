import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [postRes, repliesRes] = await Promise.all([
    supabase.from('forum_posts').select('*').eq('id', id).single(),
    supabase.from('forum_replies').select('*').eq('post_id', id).order('created_at', { ascending: true }),
  ])

  if (postRes.error) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Increment view count
  await supabase.from('forum_posts').update({ view_count: (postRes.data.view_count || 0) + 1 }).eq('id', id)

  return NextResponse.json({ post: postRes.data, replies: repliesRes.data || [] })
}
