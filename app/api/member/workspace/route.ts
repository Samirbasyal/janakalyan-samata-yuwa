import { NextResponse } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { memberAccess } from '@/lib/member-auth'
import { db } from '@/lib/db'
import { memberWorkspaceItems } from '@/lib/db/schema'

async function memberSession() {
  const access = await memberAccess()
  if (access.blocked || !access.member) return null
  return access.member
}

export async function GET() {
  const member = await memberSession()
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.select().from(memberWorkspaceItems).where(eq(memberWorkspaceItems.memberId, member.id)).orderBy(desc(memberWorkspaceItems.createdAt))
  return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const member = await memberSession()
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const itemType = ['note', 'work', 'plan', 'achievement'].includes(body.itemType) ? body.itemType : 'note'
  const title = String(body.title ?? '').trim()
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  const [item] = await db.insert(memberWorkspaceItems).values({ id: crypto.randomUUID(), memberId: member.id, itemType, title, details: body.details ? String(body.details).trim() : null, eventDate: body.eventDate ? new Date(body.eventDate) : null, isPublic: itemType === 'achievement' && Boolean(body.isPublic), updatedAt: new Date() }).returning()
  return NextResponse.json(item, { status: 201 })
}

export async function PATCH(request: Request) {
  const member = await memberSession()
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'Item id is required' }, { status: 400 })
  const [item] = await db.update(memberWorkspaceItems).set({ title: String(body.title ?? '').trim(), details: body.details ? String(body.details).trim() : null, eventDate: body.eventDate ? new Date(body.eventDate) : null, isPublic: body.itemType === 'achievement' && Boolean(body.isPublic), updatedAt: new Date() }).where(and(eq(memberWorkspaceItems.id, String(body.id)), eq(memberWorkspaceItems.memberId, member.id))).returning()
  return NextResponse.json(item ?? { error: 'Not found' }, { status: item ? 200 : 404 })
}

export async function DELETE(request: Request) {
  const member = await memberSession()
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  await db.delete(memberWorkspaceItems).where(and(eq(memberWorkspaceItems.id, String(body.id)), eq(memberWorkspaceItems.memberId, member.id)))
  return NextResponse.json({ ok: true })
}

