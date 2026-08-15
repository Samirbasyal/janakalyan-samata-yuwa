import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  adminNotes,
  announcements,
  clubRecords,
  committeeRecords,
  content,
  contentVisibility,
  donations,
  expenses,
  gallery,
  loans,
  members,
  monthlyMemberContributions,
  programs,
  works,
} from '@/lib/db/schema'
import { requireAdmin } from '@/lib/admin-auth'

const NAMED = [
  ['member', members, members.id, members.name],
  ['donation', donations, donations.id, donations.donor],
  ['expense', expenses, expenses.id, expenses.title],
  ['content', content, content.id, content.title],
  ['gallery', gallery, gallery.id, gallery.title],
  ['announcement', announcements, announcements.id, announcements.title],
  ['program', programs, programs.id, programs.name],
  ['work', works, works.id, works.title],
  ['loan', loans, loans.id, loans.borrower],
  ['monthly_fund', monthlyMemberContributions, monthlyMemberContributions.id, monthlyMemberContributions.memberName],
  ['note', adminNotes, adminNotes.id, adminNotes.title],
  ['committee', committeeRecords, committeeRecords.id, committeeRecords.memberName],
  ['club_record', clubRecords, clubRecords.id, clubRecords.title],
] as const

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const saved = await db.select().from(contentVisibility)
  const savedMap = new Map(saved.map((row) => [`${row.entityType}:${row.recordId}`, row]))

  const defaults: { entityType: string; recordId: string; name: string }[] = []
  for (const [entityType, table, idCol, nameCol] of NAMED) {
    const rows = await db
      .select({ id: idCol, name: nameCol })
      .from(table)
    defaults.push(...rows.map((r) => ({ entityType, recordId: String(r.id), name: String(r.name ?? r.id) })))
  }

  return NextResponse.json(
    defaults.map((row) => ({
      ...row,
      visibility: savedMap.get(`${row.entityType}:${row.recordId}`)?.visibility ?? 'public',
      updatedAt:
        savedMap.get(`${row.entityType}:${row.recordId}`)?.updatedAt ?? new Date().toISOString(),
    })),
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function PUT(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const entityType = String(body.entityType || '')
  const recordId = String(body.recordId || '')
  const visibility = String(body.visibility || 'public')
  if (!entityType || !recordId || !['public', 'members', 'private', 'admin'].includes(visibility))
    return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 })
  const id = `${entityType}:${recordId}`
  const [row] = await db
    .insert(contentVisibility)
    .values({ id, entityType, recordId, visibility, updatedBy: session.user.id })
    .onConflictDoUpdate({
      target: contentVisibility.id,
      set: { visibility, updatedBy: session.user.id, updatedAt: new Date() },
    })
    .returning()
  return NextResponse.json(row)
}

export async function DELETE(request: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  await db.delete(contentVisibility).where(eq(contentVisibility.id, `${String(body.entityType)}:${String(body.recordId)}`))
  return NextResponse.json({ ok: true })
}
