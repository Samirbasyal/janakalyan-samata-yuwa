import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { content } from '@/lib/db/schema'

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await db.select().from(content).orderBy(desc(content.updatedAt)))
}

export async function POST(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const section = String(body.section ?? '').trim()
  const title = String(body.title ?? '').trim()
  const bodyText = String(body.body ?? '').trim()
  if (!section || !title || !bodyText) return NextResponse.json({ error: 'Section, title, and body are required.' }, { status: 400 })
  const row = await db.insert(content).values({ id: crypto.randomUUID(), section, title, body: bodyText, updatedBy: session.user.id }).onConflictDoUpdate({ target: content.section, set: { title, body: bodyText, updatedBy: session.user.id, updatedAt: new Date() } }).returning()
  return NextResponse.json(row[0])
}

export async function DELETE(request: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  await db.delete(content).where(eq(content.id, String(id)))
  return NextResponse.json({ ok: true })
}
