import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: post_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Missing body' }, { status: 400 })

  const { data: profile } = await supabase.from('users').select('full_name').eq('id', user.id).single()
  const author_name = profile?.full_name || user.email?.split('@')[0] || 'Pilot'

  const { data, error } = await supabase
    .from('forum_replies')
    .insert({ post_id, user_id: user.id, author_name, body: body.trim() })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Increment reply count
  await supabase.rpc('increment_reply_count', { post_id })

  return NextResponse.json({ reply: data })
}
