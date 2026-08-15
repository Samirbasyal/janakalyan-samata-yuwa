import { NextResponse } from 'next/server'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { members, monthlyMemberContributions } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/admin-auth'

const monthKey = (value: string | null) => /^\d{4}-\d{2}$/.test(value ?? '') ? value as string : new Date().toISOString().slice(0, 7)
const receipt = () => `KOSHA-${Date.now().toString(36).toUpperCase()}`

export async function GET(request: Request) {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const month = monthKey(new URL(request.url).searchParams.get('month'))
    const activeMembers = await db.select().from(members).where(eq(members.status, 'active')).orderBy(asc(members.name))
    const payments = await db.select().from(monthlyMemberContributions).where(eq(monthlyMemberContributions.collectionMonth, month))
    const byMember = new Map(payments.map((payment) => [payment.memberId, payment]))
    const rows = activeMembers.map((member) => byMember.get(member.id) ?? { id: null, memberId: member.id, memberName: member.name, collectionMonth: month, amount: 20, status: 'unpaid', paidAt: null, paymentMethod: null, collectedBy: null, remarks: null, receiptNumber: null })
    const paid = rows.filter((row) => row.status === 'paid')
    return NextResponse.json({ month, contribution: 20, rows, history: payments, summary: { totalMembers: rows.length, paidMembers: paid.length, unpaidMembers: rows.length - paid.length, expectedCollection: rows.length * 20, collectedAmount: paid.reduce((sum, row) => sum + Number(row.amount || 20), 0), remainingAmount: Math.max(0, rows.length * 20 - paid.reduce((sum, row) => sum + Number(row.amount || 20), 0)) } })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load monthly fund.' }, { status: 400 }) }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json(); const month = monthKey(String(body.collectionMonth ?? '')); const memberId = String(body.memberId); const member = (await db.select().from(members).where(eq(members.id, memberId)))[0]
    if (!member) return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
    const existing = (await db.select().from(monthlyMemberContributions).where(and(eq(monthlyMemberContributions.memberId, memberId), eq(monthlyMemberContributions.collectionMonth, month))))[0]
    if (existing?.status === 'paid' && !body.forceEdit) return NextResponse.json({ error: 'This member is already paid for this month.' }, { status: 409 })
    const amount = Number(body.amount ?? 20); if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'Amount must be greater than zero.' }, { status: 400 })
    const values = { status: 'paid', amount, paidAt: body.paymentDate ? new Date(String(body.paymentDate)) : new Date(), paymentMethod: String(body.paymentMethod ?? 'Cash'), collectedBy: String(body.collectedBy ?? session.user.name), remarks: body.remarks ? String(body.remarks) : null, receiptNumber: existing?.receiptNumber ?? receipt(), updatedAt: new Date() }
    const result = existing ? await db.update(monthlyMemberContributions).set(values).where(eq(monthlyMemberContributions.id, existing.id)).returning() : await db.insert(monthlyMemberContributions).values({ id: crypto.randomUUID(), memberId, memberName: member.name, collectionMonth: month, ...values, createdAt: new Date() }).returning()
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save payment.' }, { status: 400 }) }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin(); if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const id = String(body.id ?? '')
    if (!id) return NextResponse.json({ error: 'Payment id is required.' }, { status: 400 })
    // Explicit status change (e.g. reject a pending submission back to unpaid)
    if (body.status && body.status !== 'paid') {
      const [row] = await db.update(monthlyMemberContributions).set({
        status: String(body.status),
        paymentMethod: body.paymentMethod !== undefined ? (body.paymentMethod || null) : undefined,
        paymentReference: body.paymentReference !== undefined ? (body.paymentReference || null) : undefined,
        paidAt: null,
        approvedAt: null,
        approvedBy: null,
        remarks: body.remarks ? String(body.remarks) : undefined,
        updatedAt: new Date(),
      }).where(eq(monthlyMemberContributions.id, id)).returning()
      return row ? NextResponse.json(row) : NextResponse.json({ error: 'Payment not found.' }, { status: 404 })
    }
    // Fall back to the POST flow (record as paid)
    return POST(new Request(request.url, { method: 'POST', headers: request.headers, body: JSON.stringify(body) }))
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update payment.' }, { status: 400 }) }
}

export async function DELETE(request: Request) {
  try { if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); const { id } = await request.json(); await db.delete(monthlyMemberContributions).where(eq(monthlyMemberContributions.id, String(id))); return NextResponse.json({ ok: true }) } catch { return NextResponse.json({ error: 'Could not delete payment.' }, { status: 400 }) }
}
