import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { memberAccess } from '@/lib/member-auth'
import { db } from '@/lib/db'
import { monthlyMemberContributions, notifications } from '@/lib/db/schema'

export async function POST(request: Request) {
  const access = await memberAccess()
  if (access.blocked === 'unauthenticated')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (access.blocked === 'pending')
    return NextResponse.json(
      { error: 'Your account is pending admin approval.' },
      { status: 403 },
    )
  if (access.blocked === 'no-profile' || !access.member)
    return NextResponse.json({ error: 'Active member profile not found' }, { status: 404 })

  const member = access.member
  const body = await request.json()
  const month = String(body.collectionMonth ?? '').trim()
  const method = String(body.paymentMethod ?? '').trim()
  const reference = String(body.paymentReference ?? '').trim()
  const proofUrl = body.paymentProofUrl ? String(body.paymentProofUrl) : null
  const amount = Number(body.amount) > 0 ? Math.round(Number(body.amount)) : 20

  if (!month || !reference)
    return NextResponse.json(
      { error: 'Collection month and transaction reference are required' },
      { status: 400 },
    )

  // Upsert: create the contribution row if it does not exist yet.
  const existing = (
    await db
      .select()
      .from(monthlyMemberContributions)
      .where(
        and(
          eq(monthlyMemberContributions.memberId, member.id),
          eq(monthlyMemberContributions.collectionMonth, month),
        ),
      )
      .limit(1)
  )[0]

  const values = {
    status: 'pending' as const,
    amount,
    paymentMethod: method,
    paymentReference: reference,
    paymentProofUrl: proofUrl,
    submittedAt: new Date(),
    updatedAt: new Date(),
    remarks: 'Submitted by member for admin verification',
  }

  let payment
  if (existing) {
    // If already paid, admin must change it back — a member cannot overwrite a confirmed payment.
    if (existing.status === 'paid')
      return NextResponse.json(
        { error: 'This month payment is already confirmed by admin.' },
        { status: 409 },
      )
    ;[payment] = await db
      .update(monthlyMemberContributions)
      .set(values)
      .where(eq(monthlyMemberContributions.id, existing.id))
      .returning()
  } else {
    ;[payment] = await db
      .insert(monthlyMemberContributions)
      .values({
        id: crypto.randomUUID(),
        memberId: member.id,
        memberName: member.name,
        collectionMonth: month,
        ...values,
      })
      .returning()
  }

  // Notify all admins instantly (bell icon + unread badge)
  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    type: 'payment_submission',
    title: 'New payment submitted',
    body: `${member.name} le Rs. ${amount} को ${month} महिनाको payment apply गरे।`,
    entityType: 'monthly_fund',
    entityId: payment.id,
    recipientRole: 'admin',
    isRead: false,
  })

  return NextResponse.json(payment)
}
