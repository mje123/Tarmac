import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'TARMAC <noreply@tarmac.study>'

function wrapHtml(subject: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#0A2463;border-radius:12px 12px 0 0;padding:28px 36px;text-align:center;">
            <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">✈ TARMAC</span>
            <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">FAA Written Test Prep</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:36px;border-radius:0 0 12px 12px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 36px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">
              © ${new Date().getFullYear()} Legion Systems LLC · TARMAC · Not affiliated with the FAA<br />
              <a href="https://tarmac.study" style="color:#3E92CC;text-decoration:none;">tarmac.study</a>
              &nbsp;·&nbsp;
              <a href="mailto:mewing713@gmail.com" style="color:#3E92CC;text-decoration:none;">Support</a>
            </p>
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
  to: string[]
  subject: string
  bodyHtml: string
}): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  const BATCH = 50
  for (let i = 0; i < to.length; i += BATCH) {
    const batch = to.slice(i, i + BATCH)
    const results = await Promise.allSettled(
      batch.map(email =>
        resend.emails.send({
          from: FROM,
          to: email,
          subject,
          html: wrapHtml(subject, bodyHtml),
        })
      )
    )
    results.forEach(r => (r.status === 'fulfilled' ? sent++ : failed++))
  }

  return { sent, failed }
}

export async function sendTransactional({
  to,
  subject,
  bodyHtml,
}: {
  to: string
  subject: string
  bodyHtml: string
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject,
    html: wrapHtml(subject, bodyHtml),
  })
}
