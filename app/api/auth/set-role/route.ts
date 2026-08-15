import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'

// Assign a public-facing role right after signup (viewer -> community_user /
// official_member). Never allows escalation to admin/staff roles.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const role = String(body.role ?? '')
    if (!email || !['community_user', 'official_member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role request.' }, { status: 400 })
    }
    const [account] = await db
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.email, email))
      .limit(1)
    if (!account) return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
    if (account.role !== 'viewer')
      return NextResponse.json({ error: 'Role already set for this account.' }, { status: 400 })
    await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, account.id))
    return NextResponse.json({ ok: true, role })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed.' }, { status: 500 })
  }
}
