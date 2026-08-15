import { NextResponse } from 'next/server'
import { and, eq, inArray, or, sql } from 'drizzle-orm'
import { activeMemberContacts, chatAccess, lastMessage, resolveStaffUser, threadKey, unreadCount } from '@/lib/chat'
import { db } from '@/lib/db'
import { chatMessages, chatReads } from '@/lib/db/schema'

export async function GET() {
  const access = await chatAccess()
  if (access.role === null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [readRow] = await db
    .select({ lastReadAt: chatReads.lastReadAt })
    .from(chatReads)
    .where(and(eq(chatReads.userId, access.userId), eq(chatReads.threadKey, 'group')))
    .limit(1)

  // Group thread
  const group = {
    key: 'group',
    name: 'Club Group',
    subtitle: access.role === 'staff' ? 'All active members' : 'All members + admin',
    lastMessage: await lastMessage('group'),
    unread: await unreadCount(access.userId, 'group', readRow?.lastReadAt ?? null),
  }

  // Contacts
  let contacts: { userId: string; name: string; role: 'member' | 'staff'; memberId?: string }[] = []
  if (access.role === 'staff') {
    const members = await activeMemberContacts()
    contacts = members.map((m) => ({ userId: m.userId, name: m.name, role: 'member' as const, memberId: m.memberId }))
  } else {
    const staff = await resolveStaffUser()
    if (staff) contacts = [{ userId: staff.id, name: staff.name || 'Admin', role: 'staff' as const }]
  }

  // Direct threads: history + contacts
  const directs = []
  for (const contact of contacts) {
    const key = threadKey(access.userId, contact.userId)
    const [read] = await db
      .select({ lastReadAt: chatReads.lastReadAt })
      .from(chatReads)
      .where(and(eq(chatReads.userId, access.userId), eq(chatReads.threadKey, key)))
      .limit(1)
    directs.push({
      key,
      other: { userId: contact.userId, name: contact.name, role: contact.role },
      lastMessage: await lastMessage(key),
      unread: await unreadCount(access.userId, key, read?.lastReadAt ?? null),
    })
  }

  return NextResponse.json(
    { me: { id: access.userId, name: access.name, role: access.role }, group, directs },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
