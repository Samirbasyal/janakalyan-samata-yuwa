import { NextResponse } from 'next/server'
import { desc, eq, inArray } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'

export async function GET(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(request.url)
  const limit = Math.min(50, Number(url.searchParams.get('limit') ?? 30) || 30)
  const rows = await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
  const unreadCount = (
    await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(eq(notifications.isRead, false))
  ).length
  return NextResponse.json(
    { items: rows, unreadCount },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function PATCH(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const id = body.id ? String(body.id) : null
  if (id) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
  } else {
    // mark all as read
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(inArray(notifications.isRead, [false]))
  }
  return NextResponse.json({ ok: true })
}
