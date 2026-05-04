import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTransactional } from '@/lib/email'
import { FEATURES } from '@/lib/features'

export async function GET(request: NextRequest) {
  if (!FEATURES.SRS) return NextResponse.json({ skipped: true })

  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()
    const now = new Date().toISOString()

    // Find users with due SRS cards
    const { data: dueCards } = await supabase
      .from('srs_cards')
      .select('user_id')
      .lte('due_at', now)

    if (!dueCards || dueCards.length === 0) return NextResponse.json({ sent: 0 })

    const userIds = [...new Set(dueCards.map(c => c.user_id as string))]

    const { data: users } = await supabase
      .from('users')
      .select('id, email, full_name')
      .in('id', userIds)

    if (!users || users.length === 0) return NextResponse.json({ sent: 0 })

    let sent = 0
    for (const u of users) {
      const count = dueCards.filter(c => c.user_id === u.id).length
      const firstName = (u.full_name as string)?.split(' ')[0] || 'Pilot'

      const body = `
        <h2 style="font-size:22px;font-weight:800;color:#0d1f3c;margin:0 0 8px;">
          📅 ${count} review${count === 1 ? '' : 's'} due today
        </h2>
        <p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 24px;">
          Hey ${firstName} — you've got <strong>${count} question${count === 1 ? '' : 's'}</strong> waiting for review in your spaced repetition queue. These are questions you missed before, now scheduled so they stick long-term.
        </p>
        <p style="font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 8px;">
          Takes about 2 minutes. The more consistently you review, the less you'll have to relearn before your checkride.
        </p>
      `

      try {
        await sendTransactional({
          to: u.email as string,
          subject: `${count} question${count === 1 ? '' : 's'} due for review — TARMAC`,
          bodyHtml: body,
          userId: u.id as string,
        })
        sent++
      } catch {}
    }

    return NextResponse.json({ sent })
  } catch (error) {
    console.error('SRS reminder error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
