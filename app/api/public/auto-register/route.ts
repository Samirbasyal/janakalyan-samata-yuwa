import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'

// Anyone can register as a member — no admin pre-approval of the email needed.
// Creates a member record with status "pending"; the admin activates it from
// the Create Member panel, and only then can the member use the dashboard.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const name = String(body.name ?? '').trim()
    const phone = String(body.phone ?? '').trim()
    if (!email || !name) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }
    const existing = (
      await db.select({ id: members.id }).from(members).where(eq(members.email, email)).limit(1)
    )[0]
    if (existing) {
      return NextResponse.json({ ok: true, listed: true, memberId: existing.id })
    }
    const [member] = await db
      .insert(members)
      .values({
        id: crypto.randomUUID(),
        name,
        role: 'Member',
        email,
        phone: phone || null,
        status: 'pending',
      })
      .returning({ id: members.id })
    return NextResponse.json({ ok: true, listed: true, memberId: member?.id })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not register.' },
      { status: 500 },
    )
  }
}
