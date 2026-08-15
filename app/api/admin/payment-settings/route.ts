import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { paymentSettings } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || !['admin', 'editor', 'treasurer'].includes(session.user.role)) throw new Error('Unauthorized')
  return session.user
}

export async function GET() {
  try { await requireAdmin(); const [settings] = await db.select().from(paymentSettings).where(eq(paymentSettings.id, 'default')); return NextResponse.json(settings ?? { id: 'default', bankQrUrl: null, esewaQrUrl: null }) } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAdmin()
    const body = await request.json()
    const bankQrUrl = typeof body.bankQrUrl === 'string' ? body.bankQrUrl : null
    const esewaQrUrl = typeof body.esewaQrUrl === 'string' ? body.esewaQrUrl : null
    const [settings] = await db.insert(paymentSettings).values({ id: 'default', bankQrUrl, esewaQrUrl, updatedBy: user.id }).onConflictDoUpdate({ target: paymentSettings.id, set: { bankQrUrl, esewaQrUrl, updatedBy: user.id, updatedAt: new Date() } }).returning()
    return NextResponse.json(settings)
  } catch { return NextResponse.json({ error: 'Unable to save payment settings' }, { status: 400 }) }
}
