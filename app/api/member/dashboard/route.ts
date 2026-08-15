import { NextResponse } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { memberAccess } from '@/lib/member-auth'
import { db } from '@/lib/db'
import {
  announcements,
  bankAccounts,
  monthlyMemberContributions,
  paymentSettings,
  programs,
} from '@/lib/db/schema'

export async function GET() {
  const access = await memberAccess()
  if (access.blocked === 'unauthenticated')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (access.blocked === 'pending')
    return NextResponse.json(
      { error: 'Your account is pending admin approval. Admin ले account Active गरेपछि मात्र login गर्न सकिन्छ।' },
      { status: 403 },
    )
  if (access.blocked === 'no-profile' || !access.member)
    return NextResponse.json({ error: 'Member profile not linked to this login' }, { status: 404 })

  const member = access.member
  const [payments, notices, events, banks, settings] = await Promise.all([
    db
      .select()
      .from(monthlyMemberContributions)
      .where(eq(monthlyMemberContributions.memberId, member.id))
      .orderBy(desc(monthlyMemberContributions.collectionMonth)),
    db
      .select()
      .from(announcements)
      .where(eq(announcements.published, true))
      .orderBy(desc(announcements.createdAt))
      .limit(10),
    db.select().from(programs).orderBy(desc(programs.programDate)).limit(10),
    db.select().from(bankAccounts).where(eq(bankAccounts.isActive, true)),
    db.query.paymentSettings.findMany({
      orderBy: (settings, { desc }) => [desc(settings.updatedAt)],
      limit: 1,
    }),
  ])
  return NextResponse.json(
    {
      member,
      payments, // all statuses: unpaid / pending / paid
      notices,
      events,
      banks,
      paymentSettings: settings[0] ?? { bankQrUrl: null, esewaQrUrl: null },
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
