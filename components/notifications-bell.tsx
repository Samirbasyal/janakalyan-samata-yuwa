'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, MessageSquareDashed } from 'lucide-react'

type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  entityType?: string | null
  entityId?: string | null
  isRead: boolean
  createdAt: string
}

export function NotificationsBell({ onOpenPayment }: { onOpenPayment: (paymentId: string) => void }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  async function load() {
    try {
      const res = await fetch('/api/admin/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setItems(data.items ?? [])
      setUnread(data.unreadCount ?? 0)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load()
    const timer = window.setInterval(load, 8000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function markRead(item: NotificationItem) {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id }),
    })
    setUnread((current) => Math.max(0, current - (item.isRead ? 0 : 1)))
    setItems((current) => current.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)))
    setOpen(false)
    if (item.entityType === 'monthly_fund' && item.entityId) {
      onOpenPayment(item.entityId)
    }
  }

  async function markAllRead() {
    await fetch('/api/admin/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    setUnread(0)
    setItems((current) => current.map((n) => ({ ...n, isRead: true })))
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-xl border p-3"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b bg-secondary/30 px-4 py-3">
            <p className="text-sm font-bold">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
              >
                <CheckCheck className="size-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <div className="grid place-items-center gap-2 p-8 text-center">
                <MessageSquareDashed className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            )}
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => markRead(item)}
                className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left transition hover:bg-secondary/40 ${item.isRead ? 'opacity-60' : 'bg-accent/10'}`}
              >
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.isRead ? 'bg-border' : 'bg-accent'}`} />
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{item.title}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.body}</span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
