import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTransactional } from '@/lib/email'

const MOTIVATIONAL = [
  "Every question you answer is one step closer to that checkmark on your knowledge test. Keep going.",
  "The pilots who pass aren't the ones who studied the most — they're the ones who never stopped.",
  "You're not just memorizing answers. You're building the foundation to fly safely. That matters.",
  "Consistency beats intensity. 20 questions a day gets you to your written faster than you think.",
  "Every CFI started exactly where you are. The test is temporary. The certificate is forever.",
  "Weather, airspace, regulations — it clicks all at once. You're closer than you feel.",
  "The ramp is waiting. The checkride is waiting. This is the part you control right now.",
]

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: users } = await admin
    .from('users')
    .select('id, email, full_name, subscription_status')
    .eq('marketing_emails', true)

  if (!users || users.length === 0) return NextResponse.json({ sent: 0 })

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: sessions } = await admin
    .from('test_sessions')
    .select('user_id, total_questions, score, session_type, started_at')
    .gte('started_at', oneWeekAgo)

  const quote = MOTIVATIONAL[Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % MOTIVATIONAL.length]

  let sent = 0
  for (const user of users) {
    if (!user.email) continue

    const userSessions = (sessions || []).filter(s => s.user_id === user.id)
    const questionsThisWeek = userSessions.reduce((sum, s) => sum + (s.total_questions || 0), 0)
    const examSessions = userSessions.filter(s => s.session_type === 'real_exam' && s.score !== null)
    const bestScore = examSessions.length > 0
      ? Math.max(...examSessions.map(s => Math.round((s.score / (s.total_questions || 60)) * 100)))
      : null

    const firstName = user.full_name?.split(' ')[0] || 'there'
    const isPaid = user.subscription_status !== 'free'

    const bodyHtml = `
      <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#0A2463;">Hey ${firstName}, here's your week in TARMAC ✈️</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td width="50%" style="padding:0 8px 0 0;">
            <div style="background:#f0f4f8;border-radius:10px;padding:16px;text-align:center;">
              <div style="font-size:32px;font-weight:900;color:#0A2463;">${questionsThisWeek}</div>
              <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Questions This Week</div>
            </div>
          </td>
          <td width="50%" style="padding:0 0 0 8px;">
            <div style="background:#f0f4f8;border-radius:10px;padding:16px;text-align:center;">
              <div style="font-size:32px;font-weight:900;color:${bestScore !== null ? (bestScore >= 70 ? '#16a34a' : '#dc2626') : '#94a3b8'};">${bestScore !== null ? `${bestScore}%` : '—'}</div>
              <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Best Exam Score</div>
            </div>
          </td>
        </tr>
      </table>

      ${questionsThisWeek === 0
        ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1e3a6e;">Looks like a quiet week — and that's okay. The important thing is getting back at it. Even 10 questions today keeps the momentum alive.</p>`
        : `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1e3a6e;">Strong work this week. ${questionsThisWeek} questions answered — you're building real knowledge, not just memorizing answers.</p>`
      }

      <div style="border-left:3px solid #FFB627;padding:12px 16px;margin:20px 0;background:#fffbf0;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:14px;font-style:italic;color:#92650a;line-height:1.6;">"${quote}"</p>
      </div>

      ${!isPaid ? `
      <div style="background:linear-gradient(135deg,#0A2463,#0d3080);border-radius:10px;padding:20px;margin-top:20px;text-align:center;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#FFB627;">Ready to go unlimited?</p>
        <p style="margin:0 0 14px;font-size:13px;color:rgba(255,255,255,0.7);">Tarmac Membership gives you unlimited questions, full AI explanations, and exam simulations.</p>
        <a href="https://tarmac.study/upgrade" style="display:inline-block;background:#FFB627;color:#0A2463;font-weight:800;font-size:13px;padding:10px 24px;border-radius:8px;text-decoration:none;">Get Tarmac Membership →</a>
      </div>` : ''}
    `

    try {
      await sendTransactional({
        to: user.email,
        userId: user.id,
        subject: `Your TARMAC week: ${questionsThisWeek} questions answered`,
        bodyHtml,
      })
      sent++
    } catch (e) {
      console.error('Weekly stats email failed for', user.email, e)
    }
  }

  console.log(`Weekly stats: sent ${sent}/${users.length}`)
  return NextResponse.json({ sent, total: users.length })
}
