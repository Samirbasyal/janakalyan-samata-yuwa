import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contentVisibility, donations } from '@/lib/db/schema'

export async function GET() {
  const [records, rules] = await Promise.all([db.select().from(donations).where(eq(donations.isPublic, true)), db.select().from(contentVisibility)])
  const hidden = new Set(rules.filter((rule) => rule.entityType === 'donation' && rule.visibility !== 'public').map((rule) => rule.recordId))
  return NextResponse.json(records.filter((record) => !hidden.has(record.id)), { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const donor = String(body.donor ?? '').trim()
    const amount = Number(body.amount)
    const purpose = String(body.purpose ?? '').trim()
    const method = String(body.method ?? '').trim()
    const reference = String(body.reference ?? '').trim()
    const donorPhone = String(body.donorPhone ?? '').trim()
    const donorEmail = String(body.donorEmail ?? '').trim().toLowerCase()
    const donorPhotoUrl = String(body.donorPhotoUrl ?? '').trim()
    const donorPhotoPathname = String(body.donorPhotoPathname ?? '').trim()
    if (!donor || !Number.isInteger(amount) || amount <= 0 || !purpose || !method) return NextResponse.json({ error: 'Please provide valid donation details.' }, { status: 400 })
    const record = await db.insert(donations).values({ id: crypto.randomUUID(), donor, amount, purpose, method, reference: reference || null, donorPhone: donorPhone || null, donorEmail: donorEmail || null, receiptNumber: `DON-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`, donorPhotoUrl: donorPhotoUrl || null, donorPhotoPathname: donorPhotoPathname || null, status: 'pending', isPublic: false, createdBy: 'public-form' }).returning({ id: donations.id })
    return NextResponse.json({ ok: true, id: record[0]?.id })
  } catch { return NextResponse.json({ error: 'Unable to record donation.' }, { status: 500 }) }
}
