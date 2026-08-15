import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { donations, expenses, applications, members, works, programs } from '@/lib/db/schema'
import { eq, inArray, sql } from 'drizzle-orm'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  try {
    await requireAdmin()
    const [income, confirmedDonations, receivedDonations, allDonations, donationCount, spent, pending, activeMembers, workCount, programCount, pendingDonationRows, pendingApps] = await Promise.all([
      db.select({ total: sql<number>`coalesce(sum(${donations.amount}), 0)` }).from(donations).where(inArray(donations.status, ['received', 'verified'])),
      db.select({ total: sql<number>`coalesce(sum(${donations.amount}), 0)` }).from(donations).where(eq(donations.status, 'verified')),
      db.select({ total: sql<number>`coalesce(sum(${donations.amount}), 0)` }).from(donations).where(eq(donations.status, 'received')),
      db.select({ total: sql<number>`coalesce(sum(${donations.amount}), 0)` }).from(donations),
      db.select({ total: sql<number>`count(*)` }).from(donations),
      db.select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` }).from(expenses),
      db.select({ total: sql<number>`count(*)` }).from(applications).where(eq(applications.status, 'pending')),
      db.select({ total: sql<number>`count(*)` }).from(members).where(eq(members.status, 'active')),
      db.select({ total: sql<number>`count(*)` }).from(works),
      db.select({ total: sql<number>`count(*)` }).from(programs),
      db.select({ amount: donations.amount }).from(donations).where(eq(donations.status, 'pending')),
      db.select({ total: sql<number>`count(*)` }).from(applications).where(eq(applications.status, 'pending')),
    ])
    const received = Number(income[0]?.total ?? 0)
    const totalConfirmed = Number(confirmedDonations[0]?.total ?? 0)
    const receivedBalance = Number(receivedDonations[0]?.total ?? 0)
    const allBalance = Number(allDonations[0]?.total ?? 0)
    const expensesTotal = Number(spent[0]?.total ?? 0)
    const pendingDonationRowsCount = pendingDonationRows.length
    const pendingDonationAmount = pendingDonationRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
    const pendingApplications = Math.max(Number(pending[0]?.total ?? 0), Number(pendingApps[0]?.total ?? 0))
    return NextResponse.json({ totalConfirmed, receivedBalance, allBalance, received, totalDonationRecords: Number(donationCount[0]?.total ?? 0), expenses: expensesTotal, balance: received - expensesTotal, pendingDonationCount: pendingDonationRowsCount, pendingDonationAmount, pendingApplications, activeMembers: Number(activeMembers[0]?.total ?? 0), works: Number(workCount[0]?.total ?? 0), programs: Number(programCount[0]?.total ?? 0) })
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}
