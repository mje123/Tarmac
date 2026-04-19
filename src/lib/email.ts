import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'TARMAC <noreply@tarmac.study>'

function wrapHtml(subject: string, body: string): string {
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
            <div style="position:relative;background:linear-gradient(135deg,#051237 0%,#0A2463 55%,#0d3080 100%);padding:0;">
              <img src="https://tarmac.study/aerial-view.jpeg" alt="" width="600"
                style="width:100%;max-width:600px;height:200px;object-fit:cover;display:block;opacity:0.35;border-radius:16px 16px 0 0;" />
              <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;">
                <img src="https://tarmac.study/logo.png" alt="TARMAC" width="48" height="48"
                  style="width:48px;height:48px;margin-bottom:12px;" />
                <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1;">TARMAC</div>
                <div style="font-size:10px;font-weight:600;color:rgba(255,255,255,0.55);letter-spacing:3px;text-transform:uppercase;margin-top:6px;">FAA Written Test Prep</div>
              </div>
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
            <p style="margin:0;font-size:12px;">
              <a href="https://tarmac.study" style="color:#FFB627;text-decoration:none;font-weight:600;">tarmac.study</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="mailto:mewing713@gmail.com" style="color:rgba(255,255,255,0.45);text-decoration:none;">Support</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="https://www.instagram.com/tarmac_writtentestprep/" style="color:rgba(255,255,255,0.45);text-decoration:none;">Instagram</a>
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
