import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBroadcast } from '@/lib/email'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const admin = createAdminClient()
  const { data: profile } = await admin.from('users').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { error: null }
}

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const admin = createAdminClient()
  const { data } = await admin
    .from('email_broadcasts')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(50)

  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { subject, body, recipient_group, specific_email } = await request.json()
  if (!subject || !body || !recipient_group) {
    return NextResponse.json({ error: 'subject, body, and recipient_group required' }, { status: 400 })
  }

  const admin = createAdminClient()

  let emails: string[] = []
  if (recipient_group === 'specific') {
    if (!specific_email) return NextResponse.json({ error: 'specific_email required' }, { status: 400 })
    emails = [specific_email]
  } else {
    let query = admin.from('users').select('email')
    if (recipient_group === 'paid') query = query.neq('subscription_status', 'free')
    if (recipient_group === 'free') query = query.eq('subscription_status', 'free')
    const { data: users } = await query
    emails = (users || []).map(u => u.email).filter(Boolean) as string[]
  }

  if (emails.length === 0) {
    return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
  }

  const bodyHtml = body
    .split('\n\n')
    .map((p: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1e3a6e;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')

  const { sent, failed } = await sendBroadcast({ to: emails, subject, bodyHtml })

  await admin.from('email_broadcasts').insert({
    subject,
    body,
    recipient_group,
    recipient_count: emails.length,
    sent_count: sent,
    failed_count: failed,
  })

  return NextResponse.json({ sent, failed, total: emails.length })
}
