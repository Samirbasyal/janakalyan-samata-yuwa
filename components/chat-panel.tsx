'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'

type ChatMessage = {
  id: string
  senderId: string
  senderName: string
  channel: string
  threadKey: string
  message: string
  createdAt: string
}

type ThreadInfo = {
  key: string
  name: string
  subtitle?: string
  unread: number
  lastMessage?: ChatMessage | null
  other?: { userId: string; name: string; role: string }
}

export function ChatPanel({ mode }: { mode: 'admin' | 'member' }) {
  const [threads, setThreads] = useState<ThreadInfo[]>([])
  const [active, setActive] = useState<string>('group')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [me, setMe] = useState<{ id: string; name: string; role: string } | null>(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/threads', { cache: 'no-store' })
      if (!res.ok) { setError('Chat unavailable'); return }
      const data = await res.json()
      setMe(data.me)
      const list: ThreadInfo[] = [data.group]
      for (const direct of data.directs) {
        list.push({
          key: direct.key,
          name: direct.other.name,
          subtitle: direct.other.role === 'staff' ? 'Admin' : 'Member',
          unread: direct.unread,
          lastMessage: direct.lastMessage,
          other: direct.other,
        })
      }
      setThreads(list)
      setError('')
    } catch {
      setError('Chat unavailable')
    }
  }, [])

  const loadMessages = useCallback(async (thread: string) => {
    try {
      const res = await fetch(`/api/messages?thread=${encodeURIComponent(thread)}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
      setMe((current) => current ?? { id: data.myId, name: data.me, role: mode === 'admin' ? 'staff' : 'member' })
      setThreads((current) => current.map((t) => (t.key === thread ? { ...t, unread: 0 } : t)))
    } catch {
      /* ignore */
    }
  }, [mode])

  useEffect(() => {
    loadThreads()
  }, [loadThreads])

  useEffect(() => {
    if (!active) return
    loadMessages(active)
    const timer = window.setInterval(() => {
      loadMessages(active)
      loadThreads()
    }, 5000)
    return () => window.clearInterval(timer)
  }, [active, loadMessages, loadThreads])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !me) return
    setBusy(true)
    const thread = threads.find((t) => t.key === active)
    const channel = active === 'group' ? 'group' : 'direct'
    const recipientId = active === 'group' ? undefined : thread?.other?.userId
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, recipientId, message: text }),
      })
      if (res.ok) {
        setDraft('')
        await loadMessages(active)
        await loadThreads()
      } else {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? 'Could not send message')
      }
    } finally {
      setBusy(false)
    }
  }

  const activeThread = threads.find((t) => t.key === active)

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <header className="flex items-center justify-between border-b bg-secondary/20 px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Messenger</p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-bold">
            <MessageCircle className="size-5" /> Club chat
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === 'admin' ? 'Group chat + 1-to-1 with every active member.' : 'Group chat + private chat with Admin.'}
          </p>
        </div>
      </header>
      {error && (
        <p className="border-b bg-destructive/10 px-5 py-2 text-sm font-semibold text-destructive">{error}</p>
      )}
      <div className="grid min-h-[420px] lg:grid-cols-[260px_1fr]">
        <aside className="border-b bg-secondary/10 lg:border-b-0 lg:border-r">
          <div className="max-h-[240px] space-y-1 overflow-y-auto p-3 lg:max-h-[440px]">
            {threads.map((thread) => (
              <button
                key={thread.key}
                type="button"
                onClick={() => setActive(thread.key)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${active === thread.key ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
              >
                <span className="min-w-0">
                  <span className="block truncate">{thread.name}</span>
                  <span className={`block truncate text-xs font-normal ${active === thread.key ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {thread.lastMessage
                      ? `${thread.lastMessage.senderName}: ${thread.lastMessage.message}`
                      : thread.subtitle ?? 'No messages yet'}
                  </span>
                </span>
                {thread.unread > 0 && (
                  <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                    {thread.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <p className="font-bold">{activeThread?.name ?? 'Chat'}</p>
            <p className="text-xs text-muted-foreground">{activeThread?.subtitle ?? 'Club group'}</p>
          </div>
          <div className="max-h-[300px] min-h-[240px] space-y-3 overflow-y-auto bg-background p-5 lg:max-h-[380px]">
            {messages.length === 0 && (
              <p className="grid h-40 place-items-center text-center text-sm text-muted-foreground">
                No messages yet — say namaste!
              </p>
            )}
            {messages.map((msg) => {
              const mine = me ? msg.senderId === me.id : false
              return (
                <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${mine ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                    {!mine && <p className="text-[10px] font-bold uppercase tracking-wide opacity-60">{msg.senderName}</p>}
                    <p className="whitespace-pre-wrap text-sm leading-6">{msg.message}</p>
                    <p className={`mt-1 text-[10px] ${mine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="flex gap-2 border-t bg-card p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              maxLength={2000}
              className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              disabled={busy || !draft.trim()}
              className="rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
