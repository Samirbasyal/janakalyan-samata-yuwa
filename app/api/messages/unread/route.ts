import { NextResponse } from 'next/server'
import { and, eq, gt, sql } from 'drizzle-orm'
import { chatAccess } from '@/lib/chat'
import { db } from '@/lib/db'
import { chatMessages, chatReads } from '@/lib/db/schema'

export async function GET() {
  const access = await chatAccess()
  if (access.role === null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Threads with a read marker for this user
  const reads = await db
    .select({ threadKey: chatReads.threadKey, lastReadAt: chatReads.lastReadAt })
    .from(chatReads)
    .where(eq(chatReads.userId, access.userId))

  let total = 0
  for (const read of reads) {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.threadKey, read.threadKey),
          sql`${chatMessages.senderId} <> ${access.userId}`,
          gt(chatMessages.createdAt, read.lastReadAt),
        ),
      )
    total += Number(rows[0]?.count ?? 0)
  }

  // Group thread with no read marker yet: count all non-self messages
  if (!reads.some((r) => r.threadKey === 'group')) {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(
        and(eq(chatMessages.threadKey, 'group'), sql`${chatMessages.senderId} <> ${access.userId}`),
      )
    total += Number(rows[0]?.count ?? 0)
  }

  return NextResponse.json({ total }, { headers: { 'Cache-Control': 'no-store' } })
}
