import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bankAccounts, paymentSettings } from '@/lib/db/schema'

export async function GET() {
  const [settings] = await db
    .select()
    .from(paymentSettings)
    .orderBy(desc(paymentSettings.updatedAt))
    .limit(1)
  const banks = await db.select().from(bankAccounts).where(eq(bankAccounts.isActive, true))
  return NextResponse.json(
    {
      ...(settings ?? { bankQrUrl: null, esewaQrUrl: null }),
      banks,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
