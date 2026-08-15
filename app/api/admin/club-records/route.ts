import { NextResponse } from 'next/server'
import { asc, desc, eq, sql } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { clubRecords } from '@/lib/db/schema'

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const records = await db.select().from(clubRecords).orderBy(desc(clubRecords.recordDate))
  const [incomeRows, expenseRows] = await Promise.all([
    db
      .select({ total: sql<number>`coalesce(sum(${clubRecords.amount}), 0)` })
      .from(clubRecords)
      .where(eq(clubRecords.type, 'income')),
    db
      .select({ total: sql<number>`coalesce(sum(${clubRecords.amount}), 0)` })
      .from(clubRecords)
      .where(eq(clubRecords.type, 'expense')),
  ])
  const income = Number(incomeRows[0]?.total ?? 0)
  const expense = Number(expenseRows[0]?.total ?? 0)
  return NextResponse.json(
    { records, summary: { income, expense, balance: income - expense } },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function POST(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const type = body.type === 'expense' ? 'expense' : 'income'
  const title = String(body.title ?? '').trim()
  const amount = Math.round(Number(body.amount) || 0)
  if (!title || amount <= 0)
    return NextResponse.json({ error: 'Title and a positive amount are required.' }, { status: 400 })
  const [row] = await db
    .insert(clubRecords)
    .values({
      id: crypto.randomUUID(),
      type,
      title,
      amount,
      category: body.category ? String(body.category).trim() : null,
      recordDate: body.recordDate ? new Date(String(body.recordDate)) : new Date(),
      notes: body.notes ? String(body.notes).trim() : null,
      createdBy: session.user.id,
    })
    .returning()
  return NextResponse.json(row, { status: 201 })
}

export async function PATCH(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const id = String(body.id ?? '')
  if (!id) return NextResponse.json({ error: 'Record id is required.' }, { status: 400 })
  const [row] = await db
    .update(clubRecords)
    .set({
      type: body.type === 'expense' ? 'expense' : body.type === 'income' ? 'income' : undefined,
      title: body.title !== undefined ? String(body.title).trim() : undefined,
      amount: body.amount !== undefined ? Math.round(Number(body.amount) || 0) : undefined,
      category: body.category !== undefined ? (String(body.category).trim() || null) : undefined,
      recordDate: body.recordDate ? new Date(String(body.recordDate)) : undefined,
      notes: body.notes !== undefined ? (String(body.notes).trim() || null) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(clubRecords.id, id))
    .returning()
  return row ? NextResponse.json(row) : NextResponse.json({ error: 'Record not found.' }, { status: 404 })
}

export async function DELETE(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  await db.delete(clubRecords).where(eq(clubRecords.id, String(body.id)))
  return NextResponse.json({ ok: true })
}
