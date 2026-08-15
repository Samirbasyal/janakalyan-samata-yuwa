import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { adminNotes } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

const visible = (value: unknown): 'public' | 'admin' =>
  value === 'public' ? 'public' : 'admin'

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await db.select().from(adminNotes).orderBy(desc(adminNotes.updatedAt)))
}

export async function POST(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const title = String(body.title ?? '').trim()
  const content = String(body.content ?? '')
  if (!title) return NextResponse.json({ error: 'Note title is required.' }, { status: 400 })
  const [note] = await db
    .insert(adminNotes)
    .values({
      id: crypto.randomUUID(),
      title,
      content,
      visibility: visible(body.visibility),
      createdBy: session.user.id,
    })
    .returning()
  return NextResponse.json(note, { status: 201 })
}

export async function PATCH(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const [note] = await db
    .update(adminNotes)
    .set({
      title: body.title !== undefined ? String(body.title).trim() : undefined,
      content: body.content !== undefined ? String(body.content) : undefined,
      visibility: body.visibility !== undefined ? visible(body.visibility) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(adminNotes.id, String(body.id)))
    .returning()
  return note ? NextResponse.json(note) : NextResponse.json({ error: 'Note not found.' }, { status: 404 })
}

export async function DELETE(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await db.delete(adminNotes).where(eq(adminNotes.id, String((await request.json()).id)))
  return NextResponse.json({ ok: true })
}
