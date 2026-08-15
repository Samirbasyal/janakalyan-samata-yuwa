import { NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  try { await requireAdmin(); return NextResponse.json(await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100)) } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
}
