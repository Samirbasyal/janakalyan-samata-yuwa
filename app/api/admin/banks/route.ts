import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { bankAccounts } from '@/lib/db/schema'

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await db.select().from(bankAccounts).orderBy(asc(bankAccounts.name))
  return NextResponse.json(rows, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const name = String(body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'Bank name is required.' }, { status: 400 })
  const [row] = await db
    .insert(bankAccounts)
    .values({
      id: crypto.randomUUID(),
      name,
      accountHolder: body.accountHolder ? String(body.accountHolder).trim() : null,
      accountNumber: body.accountNumber ? String(body.accountNumber).trim() : null,
      qrUrl: body.qrUrl ? String(body.qrUrl) : null,
      isActive: body.isActive !== false,
    })
    .returning()
  return NextResponse.json(row, { status: 201 })
}

export async function PATCH(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const id = String(body.id ?? '')
  if (!id) return NextResponse.json({ error: 'Bank id is required.' }, { status: 400 })
  const [row] = await db
    .update(bankAccounts)
    .set({
      name: body.name ? String(body.name).trim() : undefined,
      accountHolder: body.accountHolder ? String(body.accountHolder).trim() : null,
      accountNumber: body.accountNumber ? String(body.accountNumber).trim() : null,
      qrUrl: body.qrUrl ? String(body.qrUrl) : null,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
      updatedAt: new Date(),
    })
    .where(eq(bankAccounts.id, id))
    .returning()
  return NextResponse.json(row ?? { error: 'Bank not found.' }, { status: row ? 200 : 404 })
}

export async function DELETE(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const id = String(body.id ?? '')
  if (!id) return NextResponse.json({ error: 'Bank id is required.' }, { status: 400 })
  await db.delete(bankAccounts).where(eq(bankAccounts.id, id))
  return NextResponse.json({ ok: true })
}
