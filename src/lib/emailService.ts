import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface ExamEmailPayload {
  toEmail: string
  userName: string
  score: number
  totalQuestions: number
  pct: number
  passed: boolean
  pdfBuffer: Buffer
}

export async function sendExamResultEmail(payload: ExamEmailPayload) {
  const { toEmail, userName, score, totalQuestions, pct, passed, pdfBuffer } = payload
  const firstName = userName.split(' ')[0] || 'Pilot'

  const subject = `Your Practice Exam Results — ${pct}% ${passed ? '✓ Pass' : '✗'}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Exam Results</title>
  <style>
    body { margin: 0; padding: 0; background: #EDF4FC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(10,36,99,0.10); }
    .header { background: #0A2463; padding: 32px 32px 24px; }
    .header h1 { margin: 0 0 4px; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 0; color: rgba(255,255,255,0.65); font-size: 13px; }
    .gold-bar { height: 4px; background: linear-gradient(90deg, #FFB627, #3E92CC); }
    .body { padding: 32px; }
    .score-card { background: #EDF4FC; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; }
    .score-big { font-size: 52px; font-weight: 800; color: #0A2463; line-height: 1; }
    .score-pct { font-size: 28px; font-weight: 700; margin-top: 4px; }
    .pass { color: #16a34a; } .fail { color: #dc2626; }
    .badge { display: inline-block; padding: 6px 18px; border-radius: 99px; font-size: 13px; font-weight: 700; margin-top: 12px; }
    .badge-pass { background: #dcfce7; color: #15803d; }
    .badge-fail { background: #fee2e2; color: #b91c1c; }
    p { color: #1e3a6e; font-size: 15px; line-height: 1.6; }
    .cta { display: block; background: linear-gradient(135deg, #3E92CC, #2a7ab5); color: #ffffff; text-decoration: none; text-align: center; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 24px 0; }
    .footer { background: #0A2463; padding: 20px 32px; text-align: center; color: rgba(255,255,255,0.5); font-size: 12px; }
    .footer a { color: rgba(255,255,255,0.7); text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>TARMAC</h1>
      <p>Private Pilot Exam Prep</p>
    </div>
    <div class="gold-bar"></div>
    <div class="body">
      <p>Hi ${firstName},</p>
      <p>You just completed a full 60-question practice exam. Here's how you did:</p>

      <div class="score-card">
        <div class="score-big">${score}/${totalQuestions}</div>
        <div class="score-pct ${passed ? 'pass' : 'fail'}">${pct}%</div>
        <div class="badge ${passed ? 'badge-pass' : 'badge-fail'}">${passed ? '✓ PASSED' : '✗ FAILED'}</div>
      </div>

      ${passed
        ? `<p>Great work — you cleared the 70% passing threshold! Keep practicing to build even more confidence before your checkride.</p>`
        : `<p>You're not there yet, but every exam is a learning opportunity. Review the missed questions in your attached PDF report and focus on the categories where you struggled.</p>`
      }

      <p>Your detailed PDF report is attached. It includes:</p>
      <ul style="color:#1e3a6e;font-size:15px;line-height:1.8;">
        <li>Score summary &amp; pass/fail status</li>
        <li>Performance breakdown by category</li>
        <li>Every missed question with the correct answer &amp; explanation</li>
      </ul>

      <a href="https://tarmac.study/dashboard" class="cta">View Dashboard →</a>

      <p style="color:#6b7280;font-size:13px;">Keep up the momentum — consistent practice is how you ace the real thing. ✈️</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Tarmac · <a href="https://tarmac.study">tarmac.study</a></p>
      <p style="margin-top:4px;">You received this because you completed a practice exam. <a href="https://tarmac.study/dashboard">Manage preferences</a></p>
    </div>
  </div>
</body>
</html>`

  await resend.emails.send({
    from: 'Tarmac <noreply@tarmac.study>',
    to: toEmail,
    subject,
    html,
    attachments: [
      {
        filename: `tarmac-exam-${new Date().toISOString().slice(0, 10)}.pdf`,
        content: pdfBuffer,
      },
    ],
  })
}
