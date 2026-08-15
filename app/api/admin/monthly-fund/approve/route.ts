import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { monthlyMemberContributions } from '@/lib/db/schema'

export async function PATCH(request: Request) {
  const session = await requireAdmin()
  if (!session?.user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  const id = String(body.id ?? '')
  if (!id) return NextResponse.json({ error: 'Payment id is required' }, { status: 400 })
  const [updated] = await db.update(monthlyMemberContributions).set({ status: 'paid', paidAt: new Date(), approvedAt: new Date(), approvedBy: session.user.id, collectedBy: session.user.id, updatedAt: new Date() }).where(eq(monthlyMemberContributions.id, id)).returning()
  if (!updated) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  return NextResponse.json(updated)
}
