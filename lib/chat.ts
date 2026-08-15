import { headers } from 'next/headers'
import { and, eq, gt, inArray, or, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { chatMessages, chatReads, members, user } from '@/lib/db/schema'

export const ADMIN_ROLES = ['admin', 'treasurer', 'editor']

export type ChatAccess =
  | { role: 'staff'; userId: string; name: string; email: string }
  | { role: 'member'; userId: string; name: string; email: string; memberId: string }
  | { role: null }

export async function chatAccess(): Promise<ChatAccess> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id || !session.user.email) return { role: null }
  const [account] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)
  if (account?.role && ADMIN_ROLES.includes(account.role)) {
    return {
      role: 'staff',
      userId: session.user.id,
      name: session.user.name || 'Admin',
      email: session.user.email,
    }
  }
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.email, session.user.email.toLowerCase()))
    .limit(1)
  if (member && member.status === 'active') {
    return {
      role: 'member',
      userId: session.user.id,
      name: member.name || session.user.name || 'Member',
      email: session.user.email,
      memberId: member.id,
    }
  }
  return { role: null }
}

export const threadKey = (a: string, b: string) =>
  a < b ? `direct:${a}:${b}` : `direct:${b}:${a}`

export async function resolveStaffUser() {
  // Prefer an admin, otherwise any staff user.
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role })
    .from(user)
    .where(inArray(user.role, ADMIN_ROLES))
    .limit(20)
  return rows.find((row) => row.role === 'admin') ?? rows[0] ?? null
}

export async function resolveMemberUser(memberId?: string) {
  if (!memberId) return null
  const [member] = await db
    .select({ id: members.id, email: members.email, name: members.name, status: members.status })
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1)
  if (!member || member.status !== 'active' || !member.email) return null
  const [account] = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.email, member.email.toLowerCase()))
    .limit(1)
  return account ? { ...member, userId: account.id } : null
}

/** Upsert the read marker for a user on a thread, returns previous value. */
export async function touchRead(userId: string, thread: string) {
  const before = (
    await db
      .select({ lastReadAt: chatReads.lastReadAt })
      .from(chatReads)
      .where(and(eq(chatReads.userId, userId), eq(chatReads.threadKey, thread)))
      .limit(1)
  )[0]
  await db
    .insert(chatReads)
    .values({ userId, threadKey: thread, lastReadAt: new Date() })
    .onConflictDoUpdate({
      target: [chatReads.userId, chatReads.threadKey],
      set: { lastReadAt: new Date() },
    })
  return before?.lastReadAt ?? null
}

export async function unreadCount(userId: string, thread: string, since: Date | null) {
  const base = and(
    eq(chatMessages.threadKey, thread),
    sql`${chatMessages.senderId} <> ${userId}`,
  )
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(chatMessages)
    .where(since ? and(base, gt(chatMessages.createdAt, since)) : base)
  return Number(rows[0]?.count ?? 0)
}

export async function lastMessage(thread: string) {
  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.threadKey, thread))
    .orderBy(sql`${chatMessages.createdAt} desc`)
    .limit(1)
  return rows[0] ?? null
}

/** Active members who also have a user account (chat contacts for staff). */
export async function activeMemberContacts() {
  const active = await db
    .select({ id: members.id, name: members.name, email: members.email, ward: members.ward })
    .from(members)
    .where(eq(members.status, 'active'))
  const accounts = await db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user)
  const byEmail = new Map(accounts.map((a) => [a.email.toLowerCase(), a]))
  return active
    .filter((m) => m.email && byEmail.has(m.email.toLowerCase()))
    .map((m) => {
      const account = byEmail.get(m.email!.toLowerCase())!
      return { userId: account.id, memberId: m.id, name: m.name, email: m.email }
    })
}
