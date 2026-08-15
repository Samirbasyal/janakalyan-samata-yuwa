import { NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { applications, members } from '@/lib/db/schema'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = String(body.name ?? '').trim()
    const phone = String(body.phone ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const message = String(body.message ?? '').trim()
    if (!name || !phone) return NextResponse.json({ error: 'Name and phone are required.' }, { status: 400 })

    // 1. Save the membership application (admin reviews it in the panel).
    const record = await db
      .insert(applications)
      .values({ id: crypto.randomUUID(), name, phone, email: email || null, message: message || null })
      .returning({ id: applications.id })

    // 2. Auto-create a member record (status pending) when an email was given and
    //    the person is not already in the member list. This lets anyone join
    //    WITHOUT the admin pre-adding the email — the admin only needs to
    //    Activate the member afterwards.
    let memberCreated = false
    if (email) {
      const existing = (
        await db
          .select({ id: members.id })
          .from(members)
          .where(eq(members.email, email))
          .limit(1)
      )[0]
      if (!existing) {
        await db.insert(members).values({
          id: crypto.randomUUID(),
          name,
          role: 'Member',
          email,
          phone: phone || null,
          status: 'pending',
        })
        memberCreated = true
      }
    }

    return NextResponse.json({
      ok: true,
      id: record[0]?.id,
      memberCreated,
      message: memberCreated
        ? 'Application submitted. अब /member-signup बाट आफ्नो member account बनाउन सक्नुहुन्छ (admin approval पछि Active हुन्छ)।'
        : 'Application submitted. Admin ले जाँचेर सदस्य बनाउनेछन्।',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to submit application.' },
      { status: 500 },
    )
  }
}
