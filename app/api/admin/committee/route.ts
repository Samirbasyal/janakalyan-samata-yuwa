import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { committeeRecords } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  await requireAdmin()
  const records = await db.select().from(committeeRecords).orderBy(committeeRecords.position)
  return NextResponse.json(records, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const admin = await requireAdmin()
  const body = await request.json()
  if (!String(body.memberName ?? '').trim() || !String(body.position ?? '').trim()) return NextResponse.json({ error: 'Member name and position are required' }, { status: 400 })
  const [record] = await db.insert(committeeRecords).values({ id: crypto.randomUUID(), memberName: String(body.memberName).trim(), position: String(body.position).trim(), responsibilities: body.responsibilities ? String(body.responsibilities).trim() : null, workDetails: body.workDetails ? String(body.workDetails).trim() : null, workCount: Math.max(0, Number(body.workCount) || 0), achievements: body.achievements ? String(body.achievements).trim() : null }).returning()
  return NextResponse.json(record, { status: 201 })
}

export async function PATCH(request: Request) {
  await requireAdmin()
  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'Record id is required' }, { status: 400 })
  const [record] = await db.update(committeeRecords).set({ memberName: String(body.memberName ?? '').trim(), position: String(body.position ?? '').trim(), responsibilities: body.responsibilities ? String(body.responsibilities).trim() : null, workDetails: body.workDetails ? String(body.workDetails).trim() : null, workCount: Math.max(0, Number(body.workCount) || 0), achievements: body.achievements ? String(body.achievements).trim() : null, updatedAt: new Date() }).where(eq(committeeRecords.id, String(body.id))).returning()
  return NextResponse.json(record)
}

export async function DELETE(request: Request) {
  await requireAdmin()
  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'Record id is required' }, { status: 400 })
  await db.delete(committeeRecords).where(eq(committeeRecords.id, String(body.id)))
  return NextResponse.json({ ok: true })
}
