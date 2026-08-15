import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'

/**
 * Resolve the logged-in club member (must be an ACTIVE member).
 * Returns null when there is no session, no linked member profile, or the
 * member is not activated by an admin yet.
 */
export async function requireActiveMember() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.email) return null
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.email, session.user.email.toLowerCase()))
    .limit(1)
  if (!member) return null
  if (member.status !== 'active') return null
  return member
}

/**
 * Like requireActiveMember but returns a reason when blocked, so the UI can
 * show "Your account is pending admin approval".
 */
export async function memberAccess() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.email) return { member: null, session: null, blocked: 'unauthenticated' as const }
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.email, session.user.email.toLowerCase()))
    .limit(1)
  if (!member) return { member: null, session, blocked: 'no-profile' as const }
  if (member.status !== 'active') return { member, session, blocked: 'pending' as const }
  return { member, session, blocked: null as null }
}
