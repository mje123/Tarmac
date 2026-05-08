import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const [postsRes, repliesRes, resolvedRes] = await Promise.all([
    supabase.from('forum_posts').select('id', { count: 'exact', head: true }),
    supabase.from('forum_replies').select('id', { count: 'exact', head: true }),
    supabase.from('forum_posts').select('id', { count: 'exact', head: true }).eq('is_resolved', true),
  ])
  return NextResponse.json({
    total_posts: postsRes.count || 0,
    total_replies: repliesRes.count || 0,
    resolved: resolvedRes.count || 0,
  })
}
