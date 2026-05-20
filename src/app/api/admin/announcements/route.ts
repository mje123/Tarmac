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
  const { data } = await admin.from('announcements').select('*').order('created_at', { ascending: false }).limit(50)
  return NextResponse.json({ announcements: data || [] })
}

export async function POST(req: NextRequest) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { title, message, type } = await req.json()
  if (!title?.trim() || !message?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('announcements')
    .insert({ title: title.trim(), message: message.trim(), type: type || 'info' })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ announcement: data })
}

export async function PATCH(req: NextRequest) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, active } = await req.json()
  const admin = createAdminClient()
  await admin.from('announcements').update({ active }).eq('id', id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  const admin = createAdminClient()
  await admin.from('announcements').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
