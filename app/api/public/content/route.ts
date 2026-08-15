import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  adminNotes,
  announcements,
  clubRecords,
  committeeRecords,
  content,
  contentVisibility,
  gallery,
  members,
  programs,
  works,
} from '@/lib/db/schema'

export async function GET() {
  const [clubContent, publicMembers, publicWorks, publicPrograms, publicGallery, publicAnnouncements, committee, notes, records, rules] =
    await Promise.all([
      db.select().from(content),
      db.select().from(members).where(eq(members.status, 'active')),
      db.select().from(works),
      db.select().from(programs),
      db.select().from(gallery),
      db.select().from(announcements).where(eq(announcements.published, true)),
      db.select().from(committeeRecords),
      db.select().from(adminNotes).where(eq(adminNotes.visibility, 'public')).orderBy(desc(adminNotes.updatedAt)),
      db.select().from(clubRecords),
      db.select().from(contentVisibility),
    ])

  const hidden = new Set(
    rules.filter((rule) => rule.visibility !== 'public').map((rule) => `${rule.entityType}:${rule.recordId}`),
  )

  const notices = notes.map((note) => ({
    id: note.id,
    title: note.title,
    body: note.content,
    category: 'Notice',
    createdAt: note.createdAt,
  }))

  return NextResponse.json(
    {
      content: clubContent.filter((row) => !hidden.has(`content:${row.id}`)),
      members: publicMembers.filter((row) => !hidden.has(`member:${row.id}`)),
      works: publicWorks.filter((row) => !hidden.has(`work:${row.id}`)),
      programs: publicPrograms.filter((row) => !hidden.has(`program:${row.id}`)),
      gallery: publicGallery.filter((row) => !hidden.has(`gallery:${row.id}`)),
      announcements: publicAnnouncements.filter((row) => !hidden.has(`announcement:${row.id}`)),
      committee: committee.filter((row) => !hidden.has(`committee:${row.id}`)),
      records: records.filter((row) => !hidden.has(`club_record:${row.id}`)),
      notices,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
