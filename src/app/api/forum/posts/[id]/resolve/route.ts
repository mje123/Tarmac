import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: post } = await supabase.from('forum_posts').select('user_id, is_resolved').eq('id', id).single()
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (post.user_id !== user.id && !profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('forum_posts').update({ is_resolved: !post.is_resolved }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ resolved: !post.is_resolved })
}
