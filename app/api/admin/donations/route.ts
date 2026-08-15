import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { donations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function requireUser() {
  const session = await requireAdmin()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export async function GET() {
  try {
    await requireUser()
    const rows = await db.select().from(donations)
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const donor = String(body.donor ?? body.name ?? '').trim() || 'Anonymous donor'
    const amount = Number(String(body.amount ?? '').replace(/,/g, '').trim())
    const purpose = String(body.purpose ?? body.reason ?? '').trim() || 'General fund'
    const method = String(body.method ?? '').trim() || 'Cash'
    const rawStatus = String(body.status ?? '').trim().toLowerCase()
    const status = rawStatus === 'pending' ? 'pending' : rawStatus === 'verified' || rawStatus === 'confirmed' ? 'verified' : 'received'
    const isPublic = body.isPublic === true || body.isPublic === 'true' || body.isPublic === 'on'
    if (!donor || !Number.isFinite(amount) || amount <= 0 || !purpose || !method) return NextResponse.json({ error: 'Please correct the highlighted fields before saving.', details: { donor: !donor ? 'Donor name is required.' : null, amount: !Number.isFinite(amount) || amount <= 0 ? 'Enter an amount greater than 0.' : null, purpose: !purpose ? 'Purpose is required.' : null, method: !method ? 'Payment method is required.' : null } }, { status: 400 })
    const [donation] = await db.insert(donations).values({ id: crypto.randomUUID(), donor, amount: Math.round(amount), purpose, method, reference: body.reference ? String(body.reference).trim() : null, donorPhone: body.donorPhone ? String(body.donorPhone).trim() : null, donorEmail: body.donorEmail ? String(body.donorEmail).trim().toLowerCase() : null, receiptNumber: body.receiptNumber ? String(body.receiptNumber).trim() : `DON-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`, status, isPublic, createdBy: user.id }).returning()
    return NextResponse.json(donation, { status: 201 })
  } catch (error) {
    console.error('[v0] donation save failed', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save donation.' }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    await requireUser()
    const body = await request.json()
    const id = String(body.id ?? '')
    if (!id) return NextResponse.json({ error: 'Missing donation id.' }, { status: 400 })
    await db.delete(donations).where(eq(donations.id, id))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const id = String(body.id ?? '')
    const rawStatus = String(body.status ?? '').trim().toLowerCase()
    const status = rawStatus === 'pending' ? 'pending' : rawStatus === 'verified' || rawStatus === 'confirmed' ? 'verified' : 'received'
    if (!id || !['pending', 'received', 'verified'].includes(status)) return NextResponse.json({ error: 'Invalid update.' }, { status: 400 })
    const rows = await db.update(donations).set({ donor: body.donor ? String(body.donor) : undefined, amount: body.amount === undefined ? undefined : Number(body.amount), purpose: body.purpose ? String(body.purpose) : undefined, method: body.method ? String(body.method) : undefined, reference: body.reference ? String(body.reference) : undefined, donorPhone: body.donorPhone ? String(body.donorPhone) : undefined, donorEmail: body.donorEmail ? String(body.donorEmail).trim().toLowerCase() : undefined, receiptNumber: body.receiptNumber ? String(body.receiptNumber) : undefined, status, isPublic: Boolean(body.isPublic) }).where(eq(donations.id, id)).returning()
    return NextResponse.json({ ok: true, updatedBy: user.id, donation: rows[0] })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
