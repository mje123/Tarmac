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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()
  const { data: comments } = await admin
    .from('qotw_response_comments')
    .select('id, comment_text, user_id, created_at')
    .eq('response_id', id)
    .order('created_at', { ascending: true })

  const enriched = (comments || []).map(c => ({
    id: c.id,
    comment_text: c.comment_text,
    callsign: toCallsign(c.user_id),
    is_mine: c.user_id === user.id,
    created_at: c.created_at,
  }))

  return NextResponse.json({ comments: enriched })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { commentText } = await req.json()
  if (!commentText?.trim()) return NextResponse.json({ error: 'Missing comment' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('qotw_response_comments')
    .insert({ response_id: id, user_id: user.id, comment_text: commentText.trim() })
    .select('id, comment_text, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    comment: { ...data, callsign: toCallsign(user.id), is_mine: true },
  })
}
