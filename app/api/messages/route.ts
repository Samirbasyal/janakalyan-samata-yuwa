import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { chatAccess, threadKey, touchRead } from '@/lib/chat'
import { db } from '@/lib/db'
import { chatMessages, chatReads } from '@/lib/db/schema'

export async function GET(request: Request) {
  const access = await chatAccess()
  if (access.role === null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const thread = String(new URL(request.url).searchParams.get('thread') ?? 'group')
  if (thread !== 'group' && !thread.startsWith('direct:')) {
    return NextResponse.json({ error: 'Invalid thread' }, { status: 400 })
  }
  // Participant check for direct threads
  if (thread.startsWith('direct:')) {
    const parts = thread.split(':')
    if (parts.length !== 3 || (parts[1] !== access.userId && parts[2] !== access.userId)) {
      return NextResponse.json({ error: 'Not a participant of this thread' }, { status: 403 })
    }
  }

  await touchRead(access.userId, thread)
  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.threadKey, thread))
    .orderBy(asc(chatMessages.createdAt))
    .limit(500)
  return NextResponse.json(
    { thread, messages, myId: access.userId, me: access.name },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function POST(request: Request) {
  const access = await chatAccess()
  if (access.role === null) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const message = String(body.message ?? '').trim()
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  if (message.length > 2000) return NextResponse.json({ error: 'Message is too long' }, { status: 400 })

  let thread: string
  let recipientId: string | null = null
  const channel = body.channel === 'direct' ? 'direct' : 'group'

  if (channel === 'group') {
    thread = 'group'
  } else {
    recipientId = String(body.recipientId ?? '')
    if (!recipientId) return NextResponse.json({ error: 'Recipient is required' }, { status: 400 })
    if (recipientId === access.userId)
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
    thread = threadKey(access.userId, recipientId)
  }

  const [row] = await db
    .insert(chatMessages)
    .values({
      id: crypto.randomUUID(),
      senderId: access.userId,
      senderName: access.name,
      channel,
      recipientId: channel === 'direct' ? recipientId : null,
      threadKey: thread,
      message,
    })
    .returning()

  // The sender has read this thread (they just sent a message)
  await db
    .insert(chatReads)
    .values({ userId: access.userId, threadKey: thread, lastReadAt: new Date() })
    .onConflictDoUpdate({
      target: [chatReads.userId, chatReads.threadKey],
      set: { lastReadAt: new Date() },
    })

  return NextResponse.json(row, { status: 201 })
}
