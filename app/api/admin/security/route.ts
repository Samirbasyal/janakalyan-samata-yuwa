import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { verifyPassword } from 'better-auth/crypto'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { account, members, user } from '@/lib/db/schema'

const STAFF = ['admin', 'treasurer', 'editor']

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admins = await db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified })
    .from(user)
    .where(eq(user.role, 'admin'))
  return NextResponse.json({ admins })
}

export async function POST(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const action = String(body.action ?? '')

  // Add a new admin: creates a user (role admin, email unverified). The new
  // admin verifies their email and sets a password via Forgot password.
  if (action === 'add-admin') {
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    if (!name || !email) return NextResponse.json({ error: 'Name and email required.' }, { status: 400 })
    const existing = (await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1))[0]
    if (existing) return NextResponse.json({ error: 'यो email बाट account पहिले नै छ।' }, { status: 409 })
    await db.insert(user).values({
      id: crypto.randomUUID(),
      name,
      email,
      emailVerified: false,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return NextResponse.json({ ok: true, message: 'Admin थपियो। नयाँ admin ले Forgot password बाट password set गर्नुहोस्।' })
  }

  // Change the signed-in admin's own email (current password required).
  if (action === 'change-email') {
    const newEmail = String(body.newEmail ?? '').trim().toLowerCase()
    const currentPassword = String(body.currentPassword ?? '')
    if (!newEmail || !currentPassword) return NextResponse.json({ error: 'New email र current password चाहिन्छ।' }, { status: 400 })
    const cred = (
      await db
        .select({ password: account.password })
        .from(account)
        .where(eq(account.userId, session.user.id))
        .limit(1)
    )[0]
    if (!cred?.password || !(await verifyPassword({ hash: cred.password, password: currentPassword })))
      return NextResponse.json({ error: 'Current password गलत छ।' }, { status: 400 })
    const taken = (await db.select({ id: user.id }).from(user).where(eq(user.email, newEmail)).limit(1))[0]
    if (taken) return NextResponse.json({ error: 'यो email पहिले नै प्रयोगमा छ।' }, { status: 409 })
    await db.update(user).set({ email: newEmail, updatedAt: new Date() }).where(eq(user.id, session.user.id))
    await db.update(members).set({ email: newEmail }).where(eq(members.email, session.user.email ?? ''))
    return NextResponse.json({ ok: true, message: `Admin email ${newEmail} मा बदलियो। अब नयाँ email बाट login गर्नुहोस्।` })
  }

  // Remove an admin (set role back to viewer) — cannot remove yourself.
  if (action === 'remove-admin') {
    const id = String(body.id ?? '')
    if (!id || id === session.user.id) return NextResponse.json({ error: 'आफैलाई remove गर्न मिल्दैन।' }, { status: 400 })
    await db.update(user).set({ role: 'viewer', updatedAt: new Date() }).where(eq(user.id, id))
    return NextResponse.json({ ok: true, message: 'Admin हटाइयो (role viewer मा फर्कियो)।' })
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}
