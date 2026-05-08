import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  let query = supabase
    .from('forum_posts')
    .select('id, title, category, author_name, is_pinned, is_resolved, reply_count, upvotes, created_at')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (category && category !== 'all') query = query.eq('category', category)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, body, category } = await req.json()
  if (!title?.trim() || !body?.trim() || !category) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: profile } = await supabase.from('users').select('full_name').eq('id', user.id).single()
  const author_name = profile?.full_name || user.email?.split('@')[0] || 'Pilot'

  const { data, error } = await supabase
    .from('forum_posts')
    .insert({ user_id: user.id, author_name, title: title.trim(), body: body.trim(), category })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
