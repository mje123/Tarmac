import { Resend } from 'resend'

interface QuizMissedQuestion {
  questionText: string
  userAnswer: string
  correctAnswer: string
  explanation: string
  category: string
}

interface QuizEmailPayload {
  toEmail: string
  userName: string
  score: number
  totalQuestions: number
  topic: string
}

export async function sendQuizResultEmail(payload: QuizEmailPayload & { missedQuestions: QuizMissedQuestion[] }) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { toEmail, userName, score, totalQuestions, topic, missedQuestions } = payload
  const firstName = userName.split(' ')[0] || 'Pilot'
  const pct = Math.round((score / totalQuestions) * 100)
  const passed = pct >= 70

  const subject = passed
    ? `Quiz complete — ${score}/${totalQuestions} on ${topic} ✈️`
    : `Quiz results — ${score}/${totalQuestions} on ${topic}`

  const scoreColor = passed ? '#10B981' : '#EF4444'
  const scoreCardBg = passed
    ? 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)'
    : 'linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 100%)'
  const badgeBg = passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'
  const badgeText = passed ? '#34d399' : '#f87171'
  const badgeBorder = passed ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'
  const badgeLabel = passed ? '✓ &nbsp;PASSED' : '✗ &nbsp;FAILED'

  const bodyText = passed
    ? `Great work on the ${topic} quiz! You cleared 70% — keep drilling topics like this and you'll dominate the real exam.`
    : `Keep at it. Review the questions below, then retry when you're ready. <strong>Your plan includes unlimited quizzes</strong> — use them to zero in on weak spots.`

  const missedHtml = missedQuestions.length > 0 ? `
    <div style="margin-top:28px;">
      <div style="color:#0A2463;font-size:13px;font-weight:700;margin-bottom:14px;text-transform:uppercase;letter-spacing:0.5px;">
        Missed Questions (${missedQuestions.length})
      </div>
      ${missedQuestions.map((q, i) => `
        <div style="border-left:3px solid #EF4444;padding:14px 16px;margin-bottom:12px;background:#fef2f2;border-radius:0 8px 8px 0;">
          <div style="color:#374151;font-size:14px;font-weight:600;margin-bottom:8px;line-height:1.4;">${i + 1}. ${q.questionText}</div>
          <div style="color:#DC2626;font-size:13px;margin-bottom:4px;">Your answer: ${q.userAnswer}</div>
          <div style="color:#059669;font-size:13px;margin-bottom:8px;font-weight:600;">Correct: ${q.correctAnswer}</div>
          <div style="color:#6B7280;font-size:13px;line-height:1.5;">${q.explanation}</div>
        </div>
      `).join('')}
    </div>
  ` : `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px 20px;margin-top:28px;text-align:center;">
      <div style="color:#059669;font-size:14px;font-weight:700;">Perfect score! No missed questions.</div>
    </div>
  `

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quiz Results</title>
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:#0A2463;border-radius:16px 16px 0 0;padding:28px 36px 22px;border-bottom:3px solid #FFB627;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,#FFB627,#e09e1a);border-radius:8px;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:18px;">✈</span>
        </div>
        <div>
          <div style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.3px;">TARMAC</div>
          <div style="color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:0.5px;text-transform:uppercase;">Quiz Results</div>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:36px;border-radius:0 0 16px 16px;box-shadow:0 8px 40px rgba(0,0,0,0.25);">

      <p style="margin:0 0 24px;color:#0A2463;font-size:16px;line-height:1.5;">Hi ${firstName},</p>

      <!-- Score card -->
      <div style="background:${scoreCardBg};border-radius:14px;padding:32px 24px;text-align:center;margin-bottom:28px;border:1px solid ${badgeBorder};">
        <div style="color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">${topic} Quiz</div>
        <div style="color:rgba(255,255,255,0.35);font-size:11px;letter-spacing:1px;margin-bottom:12px;">10 Questions</div>
        <div style="color:#ffffff;font-size:64px;font-weight:800;line-height:1;letter-spacing:-2px;">${score}<span style="font-size:32px;color:rgba(255,255,255,0.4);font-weight:600;">/${totalQuestions}</span></div>
        <div style="color:${scoreColor};font-size:32px;font-weight:700;margin-top:6px;">${pct}%</div>
        <div style="display:inline-block;margin-top:14px;padding:7px 20px;border-radius:99px;background:${badgeBg};border:1px solid ${badgeBorder};color:${badgeText};font-size:13px;font-weight:700;letter-spacing:0.5px;">${badgeLabel}</div>
      </div>

      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.65;">${bodyText}</p>

      ${missedHtml}

      <!-- CTA -->
      <a href="https://tarmac.study/quiz"
        style="display:block;background:linear-gradient(135deg,#FFB627,#e09e1a);color:#0A2463;text-decoration:none;text-align:center;padding:15px 28px;border-radius:10px;font-weight:800;font-size:15px;letter-spacing:-0.2px;margin-top:28px;">
        Take Another Quiz &nbsp;→
      </a>

      <p style="margin:20px 0 0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.5;">Consistent practice is how you ace the real thing. You've got this. ✈️</p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px 0 8px;">
      <p style="margin:0;color:rgba(255,255,255,0.3);font-size:12px;">© ${new Date().getFullYear()} Tarmac &nbsp;·&nbsp; <a href="https://tarmac.study" style="color:rgba(255,255,255,0.4);text-decoration:none;">tarmac.study</a></p>
    </div>

  </div>
</body>
</html>`

  await resend.emails.send({
    from: 'Tarmac <noreply@tarmac.study>',
    to: toEmail,
    subject,
    html,
  })
}

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
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { toEmail, userName, score, totalQuestions, pct, passed, pdfBuffer } = payload
  const firstName = userName.split(' ')[0] || 'Pilot'

  const subject = passed
    ? `You passed! ${pct}% on your practice exam ✈️`
    : `Practice exam complete — ${pct}% (keep going)`

  const scoreColor = passed ? '#10B981' : '#EF4444'
  const scoreCardBg = passed
    ? 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)'
    : 'linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 100%)'
  const badgeBg = passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'
  const badgeText = passed ? '#34d399' : '#f87171'
  const badgeBorder = passed ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'
  const badgeLabel = passed ? '✓ &nbsp;PASSED' : '✗ &nbsp;FAILED'

  const bodyText = passed
    ? `You cleared the 70% threshold — solid work. Keep this momentum going. The more you practice, the more confident you'll feel walking into the real exam.`
    : `You're building knowledge with every attempt. Review the missed questions in your PDF report, focus on the weak categories, and retake when you're ready. <strong>Your plan includes unlimited practice exams</strong> — use them.`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Exam Results</title>
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:#0A2463;border-radius:16px 16px 0 0;padding:28px 36px 22px;border-bottom:3px solid #FFB627;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:36px;height:36px;background:linear-gradient(135deg,#FFB627,#e09e1a);border-radius:8px;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:18px;">✈</span>
        </div>
        <div>
          <div style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.3px;">TARMAC</div>
          <div style="color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:0.5px;text-transform:uppercase;">Private Pilot Exam Prep</div>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:36px;border-radius:0 0 16px 16px;box-shadow:0 8px 40px rgba(0,0,0,0.25);">

      <p style="margin:0 0 24px;color:#0A2463;font-size:16px;line-height:1.5;">Hi ${firstName},</p>

      <!-- Score card -->
      <div style="background:${scoreCardBg};border-radius:14px;padding:32px 24px;text-align:center;margin-bottom:28px;border:1px solid ${badgeBorder};">
        <div style="color:rgba(255,255,255,0.5);font-size:12px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;">Practice Exam Score</div>
        <div style="color:#ffffff;font-size:64px;font-weight:800;line-height:1;letter-spacing:-2px;">${score}<span style="font-size:32px;color:rgba(255,255,255,0.4);font-weight:600;">/${totalQuestions}</span></div>
        <div style="color:${scoreColor};font-size:32px;font-weight:700;margin-top:6px;">${pct}%</div>
        <div style="display:inline-block;margin-top:14px;padding:7px 20px;border-radius:99px;background:${badgeBg};border:1px solid ${badgeBorder};color:${badgeText};font-size:13px;font-weight:700;letter-spacing:0.5px;">${badgeLabel}</div>
      </div>

      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.65;">${bodyText}</p>

      <!-- PDF section -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 20px;margin-bottom:28px;">
        <div style="color:#0A2463;font-size:13px;font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">📎 &nbsp;Your PDF Report Includes</div>
        <div style="color:#475569;font-size:14px;line-height:1.8;">
          &nbsp;• &nbsp;Score summary &amp; pass/fail status<br/>
          &nbsp;• &nbsp;Performance breakdown by category<br/>
          &nbsp;• &nbsp;Every missed question with the correct answer &amp; explanation
        </div>
      </div>

      <!-- CTA -->
      <a href="https://tarmac.study/dashboard"
        style="display:block;background:linear-gradient(135deg,#FFB627,#e09e1a);color:#0A2463;text-decoration:none;text-align:center;padding:15px 28px;border-radius:10px;font-weight:800;font-size:15px;letter-spacing:-0.2px;">
        Back to Dashboard &nbsp;→
      </a>

      <p style="margin:20px 0 0;color:#9ca3af;font-size:13px;text-align:center;line-height:1.5;">Consistent practice is how you ace the real thing. You've got this. ✈️</p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px 0 8px;">
      <p style="margin:0;color:rgba(255,255,255,0.3);font-size:12px;">© ${new Date().getFullYear()} Tarmac &nbsp;·&nbsp; <a href="https://tarmac.study" style="color:rgba(255,255,255,0.4);text-decoration:none;">tarmac.study</a></p>
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
