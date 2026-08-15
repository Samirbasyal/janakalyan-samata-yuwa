import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { applications, members } from '@/lib/db/schema'

// History of everyone who joined via "Join our community" / the application form.
// Admin can approve (activates the linked member) or remove the person entirely
// (deletes the application and any linked member record).
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const appRows = await db.select().from(applications).orderBy(desc(applications.createdAt))
  const memberRows = await db.select().from(members)
  const byEmail = new Map(memberRows.map((m) => [m.email, m]))

  const joins = appRows.map((app) => {
    const member = app.email ? byEmail.get(app.email.toLowerCase()) : undefined
    return {
      applicationId: app.id,
      name: app.name,
      phone: app.phone,
      email: app.email,
      message: app.message,
      joinedAt: app.createdAt,
      applicationStatus: app.status,
      memberStatus: member?.status ?? null,
      memberId: member?.id ?? null,
      memberRole: member?.role ?? null,
    }
  })
  const activeCount = joins.filter((j) => j.memberStatus === 'active').length
  const pendingCount = joins.filter((j) => j.memberStatus !== 'active').length
  return NextResponse.json(
    { joins, summary: { total: joins.length, active: activeCount, pending: pendingCount } },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

// Approve a join → activate the linked member account (email active).
export async function PATCH(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const [app] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, String(body.applicationId)))
    .limit(1)
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  const email = (app.email ?? '').toLowerCase()
  let memberId: string | null = null
  if (email) {
    const existing = (
      await db.select({ id: members.id }).from(members).where(eq(members.email, email)).limit(1)
    )[0]
    if (existing) {
      memberId = existing.id
      await db.update(members).set({ status: 'active', updatedAt: new Date() }).where(eq(members.id, existing.id))
    } else {
      const [created] = await db
        .insert(members)
        .values({ id: crypto.randomUUID(), name: app.name, role: 'Member', email, phone: app.phone || null, status: 'active' })
        .returning({ id: members.id })
      memberId = created?.id ?? null
    }
  }
  await db.update(applications).set({ status: 'approved' }).where(eq(applications.id, app.id))
  return NextResponse.json({ ok: true, memberId })
}

// Remove a join: deletes the application and, if present, the linked member record.
export async function DELETE(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const [app] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, String(body.applicationId)))
    .limit(1)
  if (app?.email) {
    await db.delete(members).where(eq(members.email, app.email.toLowerCase()))
  }
  await db.delete(applications).where(eq(applications.id, String(body.applicationId)))
  return NextResponse.json({ ok: true })
}
