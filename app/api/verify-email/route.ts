import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { sendMail } from '@/lib/mail'
import { user, verification } from '@/lib/db/schema'

const CODE_TTL_MIN = 10

// 6-digit code based email verification (no link required).
// POST { email, action: 'request' }  → generates & sends a code
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
      // remove old codes
      await db.delete(verification).where(eq(verification.identifier, identifier))
      const code = String(Math.floor(100000 + Math.random() * 900000))
      await db.insert(verification).values({
        id: crypto.randomUUID(),
        identifier,
        value: code,
        expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60 * 1000),
      })
      const subject = 'Verify your email — Janakalyan Samata Yuwa Club'
      const html = `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Your verification code</h2><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>यो code <strong>${CODE_TTL_MIN} मिनेट</strong> सम्म मान्य छ। If you did not request this, ignore this email.</p></div>`
      const sent = await sendMail({ to: email, subject, html })
      if (sent.ok) return NextResponse.json({ ok: true, message: 'Code तपाईंको email मा पठाइयो।' })
      // Dev fallback: return the code so the flow is testable without a mail provider
      console.log(`[dev] Verification code for ${email}: ${code}`)
      return NextResponse.json({ ok: true, dev: code, message: 'Code पठाइयो (dev mode: code तल देखिन्छ — SMTP set नगरेसम्म)।' })
    }

    // confirm
    const code = String(body.code ?? '').trim()
    if (!/^\d{4,8}$/.test(code))
      return NextResponse.json({ error: 'Code मिलेन। ६ अंकको code हाल्नुहोस्।' }, { status: 400 })
    const [row] = await db
      .select()
      .from(verification)
      .where(eq(verification.identifier, identifier))
      .limit(1)
    if (!row) return NextResponse.json({ error: 'पहिले code माग्नुहोस् (Get verification code)।' }, { status: 400 })
    if (new Date(row.expiresAt).getTime() < Date.now()) {
      await db.delete(verification).where(eq(verification.identifier, identifier))
      return NextResponse.json({ error: 'Code expires भइसक्यो। फेरि code माग्नुहोस्।' }, { status: 400 })
    }
    if (row.value !== code)
      return NextResponse.json({ error: 'Code मिलेन। फेरि हेर्नुहोस्।' }, { status: 400 })

    await db
      .update(user)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(user.id, account.id))
    await db.delete(verification).where(eq(verification.identifier, identifier))
    return NextResponse.json({ ok: true, message: 'Email verified!' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed.' },
      { status: 500 },
    )
  }
}
