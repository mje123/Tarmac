import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get('uid')
  if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('users').update({
    marketing_emails: false,
    unsubscribed_at: new Date().toISOString(),
  }).eq('id', uid)

  if (error) return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })

  return NextResponse.redirect(new URL('/unsubscribed', request.url))
}
