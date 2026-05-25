import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

export async function GET() {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = createAdminClient()
  const { data } = await admin.from('qotw_posts').select('*').order('week_start', { ascending: false }).limit(20)
  return NextResponse.json({ posts: data || [] })
}

export async function POST(req: NextRequest) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { question_text, question_type, context, week_start } = await req.json()
  if (!question_text?.trim() || !week_start) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('qotw_posts')
    .upsert({ question_text: question_text.trim(), question_type: question_type || 'situation', context: context?.trim() || null, week_start }, { onConflict: 'week_start' })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}

export async function DELETE(req: NextRequest) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  const admin = createAdminClient()
  await admin.from('qotw_posts').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
