import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { firstName } = await request.json().catch(() => ({}))
    const name = firstName || user.user_metadata?.full_name?.split(' ')[0] || 'Pilot'

    await sendWelcomeEmail({ to: user.email!, userId: user.id, firstName: name })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Welcome email error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
