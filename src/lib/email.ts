import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'TARMAC <noreply@tarmac.study>'

function wrapHtml(subject: string, body: string, userId?: string): string {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:32px 16px 48px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Hero banner -->
        <tr>
          <td style="border-radius:16px 16px 0 0;overflow:hidden;padding:0;">
            <!-- Formation photo full bleed -->
            <img src="https://tarmac.study/formation.png" alt="Formation flight" width="600"
              style="width:100%;max-width:600px;height:240px;object-fit:cover;object-position:center;display:block;border-radius:16px 16px 0 0;" />
            <!-- Logo bar over photo -->
            <div style="background:linear-gradient(180deg,rgba(5,18,55,0.0) 0%,rgba(5,18,55,0.92) 100%);margin-top:-80px;padding:20px 36px 28px;text-align:center;">
              <img src="https://tarmac.study/logo-white.png" alt="TARMAC" width="44" height="44"
                style="width:44px;height:44px;display:inline-block;vertical-align:middle;margin-right:10px;" />
              <span style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;vertical-align:middle;">TARMAC</span>
              <div style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.5);letter-spacing:3px;text-transform:uppercase;margin-top:4px;">FAA Written Test Prep</div>
            </div>
          </td>
        </tr>

        <!-- Gold accent bar -->
        <tr>
          <td style="background:#FFB627;height:4px;font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px 44px 36px;border-radius:0;">
            ${body}
            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
              <tr>
                <td align="center">
                  <a href="https://tarmac.study/dashboard"
                    style="display:inline-block;background:linear-gradient(135deg,#FFB627,#f5a800);color:#0A2463;font-weight:800;font-size:14px;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
                    ✈ &nbsp;Open TARMAC
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Bottom image strip -->
        <tr>
          <td style="padding:0;overflow:hidden;">
            <img src="https://tarmac.study/mountains.jpeg" alt="" width="600"
              style="width:100%;max-width:600px;height:100px;object-fit:cover;display:block;opacity:0.7;" />
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0A2463;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.5);">
              © ${year} Legion Systems LLC &nbsp;·&nbsp; Not affiliated with the FAA
            </p>
            <p style="margin:0 0 10px;font-size:12px;">
              <a href="https://tarmac.study" style="color:#FFB627;text-decoration:none;font-weight:600;">tarmac.study</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="mailto:mewing713@gmail.com" style="color:rgba(255,255,255,0.45);text-decoration:none;">Support</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="https://www.instagram.com/tarmac_writtentestprep/" style="color:rgba(255,255,255,0.45);text-decoration:none;">Instagram</a>
            </p>
            ${userId ? `<p style="margin:0;font-size:10px;color:rgba(255,255,255,0.25);">
              <a href="https://tarmac.study/api/unsubscribe?uid=${userId}" style="color:rgba(255,255,255,0.3);text-decoration:underline;">Unsubscribe from emails</a>
            </p>` : ''}
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`
}

export async function sendBroadcast({
  to,
  subject,
  bodyHtml,
}: {
  to: { email: string; userId?: string }[]
  subject: string
  bodyHtml: string
}): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  const BATCH = 50
  for (let i = 0; i < to.length; i += BATCH) {
    const batch = to.slice(i, i + BATCH)
    const results = await Promise.allSettled(
      batch.map(({ email, userId }) =>
        resend.emails.send({
          from: FROM,
          to: email,
          subject,
          html: wrapHtml(subject, bodyHtml, userId),
        })
      )
    )
    results.forEach(r => (r.status === 'fulfilled' ? sent++ : failed++))
  }

  return { sent, failed }
}

export async function sendTransactional({
  to,
  userId,
  subject,
  bodyHtml,
}: {
  to: string
  userId?: string
  subject: string
  bodyHtml: string
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject,
    html: wrapHtml(subject, bodyHtml, userId),
  })
}

export async function sendWelcomeEmail({ to, userId, firstName }: { to: string; userId: string; firstName: string }) {
  const body = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#0A2463;letter-spacing:-0.5px;">
      Welcome to TARMAC, ${firstName}. ✈️
    </h1>
    <p style="margin:0 0 24px;font-size:13px;color:#6b7c9e;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
      FAA Private Pilot Written Test Prep
    </p>

    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#1e3a6e;">
      You just made the smartest move on your path to a pilot certificate. TARMAC is built around one goal: <strong>help you pass your FAA written test on the first try</strong>.
    </p>

    <div style="background:linear-gradient(135deg,#f0f7ff,#e8f0fe);border-radius:12px;padding:24px 28px;margin:24px 0;border-left:4px solid #FFB627;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7c9e;">What's waiting for you</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        ${[
          ['📚', '1,400+ practice questions', 'Every FAA knowledge area covered'],
          ['🤖', 'AI Tutor', 'Explains the WHY behind every answer'],
          ['⏱', 'Timed Practice Exams', '60 questions, just like the real FAA test'],
          ['🎯', 'Weak-area targeting', 'Drills the categories you\u2019re weakest in'],
        ].map(([icon, title, sub]) => `
        <tr>
          <td style="padding:6px 0;vertical-align:top;width:36px;font-size:20px;">${icon}</td>
          <td style="padding:6px 0 6px 8px;vertical-align:top;">
            <div style="font-size:14px;font-weight:700;color:#0A2463;">${title}</div>
            <div style="font-size:13px;color:#6b7c9e;margin-top:1px;">${sub}</div>
          </td>
        </tr>`).join('')}
      </table>
    </div>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1e3a6e;">
      <strong>The #1 tip from students who pass:</strong> don't just memorize answers — understand the concept. That's exactly what the AI Tutor is built to do.
    </p>

    <div style="background:#0A2463;border-radius:10px;padding:18px 22px;margin:24px 0;text-align:center;">
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7);">91% of students who practice <strong style="color:#FFB627;">200+ questions</strong> pass on their first attempt.</p>
    </div>

    <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1e3a6e;">
      Start your first practice session today — your future self will thank you.
    </p>
    <p style="margin:0;font-size:15px;color:#6b7c9e;">— The TARMAC Team</p>
  `

  return sendTransactional({ to, userId, subject: `Welcome to TARMAC, ${firstName} ✈️`, bodyHtml: body })
}

export async function sendTrialStartEmail({ to, userId, firstName }: { to: string; userId: string; firstName: string }) {
  const trialEndDate = new Date()
  trialEndDate.setDate(trialEndDate.getDate() + 7)
  const formatted = trialEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const body = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#0A2463;letter-spacing:-0.5px;">
      Your free trial has started. 🛫
    </h1>
    <p style="margin:0 0 24px;font-size:13px;color:#6b7c9e;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
      7 days of full access — starting now
    </p>

    <div style="background:linear-gradient(135deg,#fff8e7,#fff3d0);border-radius:12px;padding:20px 24px;margin:0 0 24px;border:1.5px solid #FFB627;">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="font-size:13px;color:#8a6200;font-weight:600;">Trial ends</td>
          <td style="text-align:right;font-size:15px;font-weight:800;color:#0A2463;">${formatted}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#8a6200;font-weight:600;padding-top:8px;">After trial</td>
          <td style="text-align:right;font-size:15px;font-weight:800;color:#0A2463;padding-top:8px;">$14.99/month</td>
        </tr>
      </table>
      <p style="margin:12px 0 0;font-size:12px;color:#8a6200;">Cancel before ${formatted} and you will not be charged — no questions asked.</p>
    </div>

    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#1e3a6e;">
      Hey ${firstName}! Your 7-day TARMAC trial is live. Here's how to make the most of it:
    </p>

    <div style="background:#f8faff;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
      <p style="margin:0 0 14px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7c9e;">Your 7-day game plan</p>
      ${[
        ['Day 1–2', 'Do your first practice session. Aim for 20–30 questions. See where you stand.'],
        ['Day 3–4', 'Use the AI Tutor on questions you got wrong. Understand WHY, not just what.'],
        ['Day 5–6', 'Take a full 60-question timed practice exam. Find your weak categories.'],
        ['Day 7', 'Drill your weakest category until you\'re above 70%. You\'ll feel the difference.'],
      ].map(([day, tip], i) => `
        <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:${i < 3 ? '12px' : '0'}">
          <tr>
            <td style="vertical-align:top;width:72px;">
              <span style="display:inline-block;background:#0A2463;color:#FFB627;font-size:11px;font-weight:800;padding:3px 8px;border-radius:20px;white-space:nowrap;">${day}</span>
            </td>
            <td style="vertical-align:top;padding-left:10px;font-size:14px;line-height:1.6;color:#1e3a6e;">${tip}</td>
          </tr>
        </table>`).join('')}
    </div>

    <div style="background:#0A2463;border-radius:10px;padding:18px 22px;margin:0 0 24px;text-align:center;">
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7);">Students who complete <strong style="color:#FFB627;">at least 3 practice sessions</strong> in their first week are <strong style="color:#FFB627;">4× more likely</strong> to pass.</p>
    </div>

    <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1e3a6e;">
      The cockpit is calling. Let's get you ready.
    </p>
    <p style="margin:0;font-size:15px;color:#6b7c9e;">— The TARMAC Team</p>
  `

  return sendTransactional({ to, userId, subject: `Your TARMAC trial is live — 7 days of full access`, bodyHtml: body })
}
