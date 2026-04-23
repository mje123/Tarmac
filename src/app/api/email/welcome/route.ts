import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, firstName } = await request.json().catch(() => ({}))
    if (!userId || !email) return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 })

    const name = firstName || 'Pilot'
    await sendWelcomeEmail({ to: email, userId, firstName: name })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Welcome email error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
