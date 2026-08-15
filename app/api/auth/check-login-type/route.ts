import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { members, user } from '@/lib/db/schema'

const STAFF = ['admin', 'treasurer', 'editor']

// Tells a login/signup page which system an email belongs to, so cross-login
// attempts can show the correct message ("This is an Admin ID", etc.).
export async function GET(request: Request) {
  const email = String(new URL(request.url).searchParams.get('email') ?? '').trim().toLowerCase()
  if (!email) return NextResponse.json({ type: 'none' })
  const [account] = await db
    .select({ id: user.id, email: user.email, role: user.role, emailVerified: user.emailVerified })
    .from(user)
    .where(eq(user.email, email))
    .limit(1)
  if (account && STAFF.includes(account.role))
    return NextResponse.json({ type: 'admin', email, emailVerified: account.emailVerified })
  if (account && account.role === 'community_user')
    return NextResponse.json({ type: 'community', email, emailVerified: account.emailVerified })
  const [member] = await db
    .select({ id: members.id, status: members.status, name: members.name })
    .from(members)
    .where(eq(members.email, email))
    .limit(1)
  if (member) return NextResponse.json({ type: 'official_member', email, memberStatus: member.status, memberName: member.name })
  if (account) return NextResponse.json({ type: 'other', email })
  return NextResponse.json({ type: 'none', email })
}
