import nodemailer from 'nodemailer'

/**
 * Send an email using, in order of preference:
 *  1. SMTP (Gmail app password or any SMTP) — SMTP_HOST/USER/PASS/FROM
 *  2. Resend — RESEND_API_KEY + RESEND_FROM_EMAIL
 *  3. Dev fallback — logs the email (and the caller may surface the code)
 * Returns { ok: true } | { ok: false, reason: 'smtp'|'resend'|'dev'|'error' }.
 */
export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<{ ok: boolean; reason: string; info?: string }> {
  // 1) SMTP (Gmail etc.)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
      })
      return { ok: true, reason: 'smtp' }
    } catch (error) {
      console.error('[mail] SMTP failed:', error instanceof Error ? error.message : error)
    }
  }

  // 2) Resend
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to,
        subject,
        html,
      })
      return { ok: true, reason: 'resend' }
    } catch (error) {
      console.error('[mail] Resend failed:', error instanceof Error ? error.message : error)
    }
  }

  // 3) Dev fallback
  console.log(`[mail:dev] To: ${to} | ${subject}\n${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300)}`)
  return { ok: false, reason: 'dev' }
}
