import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { monthlyMemberContributions } from '@/lib/db/schema'

export async function GET(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = String(new URL(request.url).searchParams.get('id') ?? '')
  if (!id) return NextResponse.json({ error: 'Payment id is required' }, { status: 400 })
  const [payment] = await db
    .select()
    .from(monthlyMemberContributions)
    .where(eq(monthlyMemberContributions.id, id))
    .limit(1)
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  return NextResponse.json({ payment, month: payment.collectionMonth })
}
