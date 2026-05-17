import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const NATO = ['ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT','GOLF','HOTEL',
               'INDIA','JULIET','KILO','LIMA','MIKE','NOVEMBER','OSCAR','PAPA',
               'QUEBEC','ROMEO','SIERRA','TANGO','UNIFORM','VICTOR','WHISKEY',
               'XRAY','YANKEE','ZULU']

function toCallsign(userId: string): string {
  const hex = userId.replace(/-/g, '').slice(0, 8)
  const n = parseInt(hex, 16)
  return `${NATO[n % NATO.length]}-${String(n % 1000).padStart(3, '0')}`
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: responseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('qotd_response_comments')
    .select('id, comment_text, user_id, created_at')
    .eq('response_id', responseId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const comments = (data || []).map(c => ({
    id: c.id,
    comment_text: c.comment_text,
    callsign: toCallsign(c.user_id),
    is_mine: c.user_id === user.id,
    created_at: c.created_at,
  }))

  return NextResponse.json({ comments })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: responseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { commentText } = await req.json()
  if (!commentText?.trim()) return NextResponse.json({ error: 'Empty comment' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('qotd_response_comments')
    .insert({ response_id: responseId, user_id: user.id, comment_text: commentText.trim() })
    .select('id, comment_text, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    comment: { ...data, callsign: toCallsign(user.id), is_mine: true },
  })
}
