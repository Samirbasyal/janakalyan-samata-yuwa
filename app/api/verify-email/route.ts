import { NextResponse } from 'next/server'
import { createHash, randomInt } from 'node:crypto'
import { eq, lt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { sendMail } from '@/lib/mail'
import { user, verification } from '@/lib/db/schema'

const CODE_TTL_MIN = 10
const RESEND_COOLDOWN_SEC = 60
const CLUB_NAME = 'Janakalyan Samata Yuwa Club'

const hashCode = (code: string) => createHash('sha256').update(code).digest('hex')

// 6-digit code based email verification (no link required).
// POST { email, action: 'request' }  → generates & sends a code (cooldown 60s)
// POST { email, action: 'confirm', code } → marks the user's email verified
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const action = body.action === 'confirm' ? 'confirm' : 'request'
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

    const [account] = await db
      .select({ id: user.id, email: user.email, emailVerified: user.emailVerified })
      .from(user)
      .where(eq(user.email, email))
      .limit(1)
    if (!account) return NextResponse.json({ error: 'यो email बाट account बनेको छैन।' }, { status: 404 })
    if (account.emailVerified)
      return NextResponse.json({ ok: true, message: 'Email पहिले नै verified छ।' })

    const identifier = `email-code:${email}`

    if (action === 'request') {
      // Resend cooldown: 60 seconds between requests
      const last = (
        await db
          .select({ createdAt: verification.createdAt })
          .from(verification)
          .where(eq(verification.identifier, identifier))
          .limit(1)
      )[0]
      if (last) {
        const elapsed = Date.now() - new Date(last.createdAt).getTime()
        if (elapsed < RESEND_COOLDOWN_SEC * 1000) {
          const wait = Math.ceil((RESEND_COOLDOWN_SEC * 1000 - elapsed) / 1000)
          return NextResponse.json(
            { error: `कृपया ${wait} सेकेन्ड पछि फेरि code माग्नुहोस्।` },
            { status: 429 },
          )
        }
        // old code is invalidated
        await db.delete(verification).where(eq(verification.identifier, identifier))
      }

      // Unpredictable 6-digit code, stored as a SHA-256 hash (not plain text)
      const code = String(randomInt(100000, 1000000))
      await db.insert(verification).values({
        id: crypto.randomUUID(),
        identifier,
        value: hashCode(code),
        expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60 * 1000),
      })

      const subject = `Verify your email — ${CLUB_NAME}`
      const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#f7f5f1;padding:24px;border-radius:12px">
  <h2 style="color:#0f4a5a;margin:0 0 8px">${CLUB_NAME}</h2>
  <p style="color:#444;line-height:1.6">Your email verification code:</p>
  <p style="font-size:34px;font-weight:800;letter-spacing:8px;color:#0f4a5a;background:#fff;border:2px dashed #d9a441;border-radius:10px;padding:12px;text-align:center">${code}</p>
  <p style="color:#666;font-size:13px">यो code <strong>${CODE_TTL_MIN} मिनेट</strong> सम्म मान्य छ। यो code कसैसँग share नगर्नुहोस्।</p>
  <p style="color:#999;font-size:12px">यदि तपाईंले account बनाउनुभएको छैन भने यो email ignore गर्नुहोस्।</p>
</div>`

      const sent = await sendMail({ to: email, subject, html })
      if (sent.ok) {
        console.log(`[verify-email] Code sent to ${email} via ${sent.reason}.`)
        return NextResponse.json({ ok: true, message: 'Verification code has been sent to your email.' })
      }
      // No provider configured / send failed
      const dev = process.env.NODE_ENV !== 'production'
      if (dev) {
        console.log(`[dev] Verification code for ${email}: ${code}`)
        return NextResponse.json({ ok: true, dev: code, message: 'Code पठाइयो (dev mode: code तल देखिन्छ)।' })
      }
      console.error(`[verify-email] Could not send code to ${email}: ${sent.reason} (SMTP not configured or send failed).`)
      return NextResponse.json(
        { error: 'Verification code पठाउन सकिएन। कृपया पछि फेरि प्रयास गर्नुहोस्।' },
        { status: 500 },
      )
    }

    // confirm
    const code = String(body.code ?? '').trim()
    if (!/^\d{6}$/.test(code))
      return NextResponse.json({ error: 'Code मिलेन। ६ अंकको code हाल्नुहोस्।' }, { status: 400 })
    const [row] = await db
      .select({ value: verification.value, expiresAt: verification.expiresAt })
      .from(verification)
      .where(eq(verification.identifier, identifier))
      .limit(1)
    if (!row) return NextResponse.json({ error: 'पहिले code माग्नुहोस् (Get verification code)।' }, { status: 400 })
    if (new Date(row.expiresAt).getTime() < Date.now()) {
      await db.delete(verification).where(eq(verification.identifier, identifier))
      return NextResponse.json({ error: 'Code expires भइसक्यो। फेरि code माग्नुहोस्।' }, { status: 400 })
    }
    if (row.value !== hashCode(code)) {
      // wrong code — allow a few retries, but never leak anything
      return NextResponse.json({ error: 'Code मिलेन। फेरि हेर्नुहोस्।' }, { status: 400 })
    }

    await db
      .update(user)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(user.id, account.id))
    // Invalidate the code after successful verification
    await db.delete(verification).where(eq(verification.identifier, identifier))
    return NextResponse.json({ ok: true, message: 'Email verified!' })
  } catch (error) {
    console.error('[verify-email] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Verification failed. कृपया फेरि प्रयास गर्नुहोस्।' },
      { status: 500 },
    )
  }
}
