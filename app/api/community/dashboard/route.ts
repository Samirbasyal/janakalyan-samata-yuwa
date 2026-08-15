import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { adminNotes, announcements, programs, user } from '@/lib/db/schema'

// Public Community Dashboard data — only for role 'community_user'.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [account] = await db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)
  if (!account || account.role !== 'community_user')
    return NextResponse.json({ error: 'Access denied — community dashboard only.' }, { status: 403 })
  if (!account.emailVerified)
    return NextResponse.json({ error: 'Please verify your email address before accessing your community account.' }, { status: 403 })
  const [announcementsRows, events, notices] = await Promise.all([
    db.select().from(announcements).where(eq(announcements.published, true)).orderBy(desc(announcements.createdAt)).limit(10),
    db.select().from(programs).orderBy(desc(programs.programDate)).limit(10),
    db.select().from(adminNotes).where(eq(adminNotes.visibility, 'public')).orderBy(desc(adminNotes.updatedAt)).limit(10),
  ])
  return NextResponse.json(
    {
      profile: { name: account.name, email: account.email, role: account.role },
      announcements: announcementsRows,
      events,
      notices: notices.map((n) => ({ id: n.id, title: n.title, body: n.content, createdAt: n.createdAt })),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
