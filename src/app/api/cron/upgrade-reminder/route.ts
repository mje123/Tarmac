import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTransactional } from '@/lib/email'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: users } = await admin
    .from('users')
    .select('id, email, full_name')
    .eq('subscription_status', 'free')
    .eq('marketing_emails', true)

  if (!users || users.length === 0) return NextResponse.json({ sent: 0 })

  const { data: allSessions } = await admin
    .from('test_sessions')
    .select('user_id, total_questions')

  let sent = 0
  for (const user of users) {
    if (!user.email) continue

    const userSessions = (allSessions || []).filter(s => s.user_id === user.id)
    const totalAnswered = userSessions.reduce((sum, s) => sum + (s.total_questions || 0), 0)
    const firstName = user.full_name?.split(' ')[0] || 'there'

    const bodyHtml = `
      <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#0A2463;">Hey ${firstName} — your free trial is still running 🛫</p>

      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1e3a6e;">
        You've answered <strong>${totalAnswered} questions</strong> on TARMAC so far. That's real progress — and you're doing it on the free tier.
      </p>

      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1e3a6e;">
        Here's what you're missing with a free account:
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        ${[
          ['Unlimited practice questions', true],
          ['Full exam simulations (60 questions)', true],
          ['AI Tutor — ask follow-up questions', true],
          ['Weak area tracking', true],
          ['10 free questions', false],
        ].map(([feature, locked]) => `
          <tr>
            <td style="padding:6px 0;font-size:14px;color:${locked ? '#16a34a' : '#64748b'};">
              ${locked ? '✅' : '🔒'} &nbsp; ${feature}
            </td>
          </tr>
        `).join('')}
      </table>

      <div style="background:linear-gradient(135deg,#0A2463,#0d3080);border-radius:12px;padding:24px;text-align:center;">
        <p style="margin:0 0 4px;font-size:16px;font-weight:800;color:#FFB627;">Tarmac Membership — $14.99/month</p>
        <p style="margin:0 0 16px;font-size:13px;color:rgba(255,255,255,0.65);">Less than a single FAA retake fee. Cancel anytime.</p>
        <a href="https://tarmac.study/upgrade"
          style="display:inline-block;background:#FFB627;color:#0A2463;font-weight:800;font-size:14px;padding:12px 32px;border-radius:10px;text-decoration:none;">
          Get Tarmac Membership →
        </a>
      </div>
    `

    try {
      await sendTransactional({
        to: user.email,
        userId: user.id,
        subject: `${firstName}, your TARMAC free trial is waiting`,
        bodyHtml,
      })
      sent++
    } catch (e) {
      console.error('Upgrade reminder failed for', user.email, e)
    }
  }

  console.log(`Upgrade reminder: sent ${sent}/${users.length}`)
  return NextResponse.json({ sent, total: users.length })
}
