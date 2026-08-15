import { NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get('email')?.trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  const member = (await db.select({ id: members.id, name: members.name, email: members.email, status: members.status }).from(members).where(sql`lower(trim(${members.email})) = ${email}`).limit(1))[0]
  return NextResponse.json({ listed: Boolean(member), member: member ?? null })
}
