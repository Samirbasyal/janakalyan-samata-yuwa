'use client'

import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { BellRing, CalendarDays, LogOut, Megaphone, UserRound } from 'lucide-react'

// Public Community Dashboard — BLUE theme. Only for community_user role.
type Data = {
  profile: { name: string; email: string; role: string }
  announcements: { id: string; title: string; body: string; category: string | null }[]
  events: { id: string; name: string; description: string; location: string | null; programDate: string | null }[]
  notices: { id: string; title: string; body: string; createdAt: string }[]
}

export function CommunityDashboard() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/community/dashboard')
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error)
        setData(body)
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error)
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-blue-300 bg-blue-50 p-6 text-blue-900">
          <p className="font-bold">Community dashboard</p>
          <p className="mt-2 text-sm leading-6">{error}</p>
          <a href="/community-login" className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">
            Go to community login
          </a>
        </div>
      </main>
    )
  if (!data)
    return (
      <main className="mx-auto max-w-5xl p-6">
        <div className="animate-pulse rounded-2xl bg-blue-100 p-12">Loading community dashboard...</div>
      </main>
    )

  return (
    <main className="min-h-screen bg-blue-50/60">
      <header className="border-b border-blue-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-semibold text-blue-600">Join Community · Public Dashboard</p>
            <h1 className="text-2xl font-bold">Namaste, {data.profile.name}</h1>
            <p className="text-xs text-muted-foreground">{data.profile.email} · Community member</p>
          </div>
          <button
            className="rounded-xl border border-blue-300 px-3 py-2 text-sm font-bold text-blue-700"
            onClick={() => authClient.signOut().then(() => (location.href = '/'))}
          >
            <LogOut className="mr-1 inline size-4" /> Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 p-5">
        {/* Profile */}
        <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-blue-800">
            <UserRound className="size-5" /> My profile
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-blue-50 p-4">
              <dt className="text-xs text-muted-foreground">Full name</dt>
              <dd className="mt-1 font-bold">{data.profile.name}</dd>
            </div>
            <div className="rounded-xl bg-blue-50 p-4">
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="mt-1 font-bold">{data.profile.email}</dd>
            </div>
            <div className="rounded-xl bg-blue-50 p-4">
              <dt className="text-xs text-muted-foreground">Role</dt>
              <dd className="mt-1 font-bold">Public Community User</dd>
            </div>
          </dl>
        </section>

        {/* Announcements */}
        <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-blue-800">
            <Megaphone className="size-5" /> Announcements
          </h2>
          <div className="mt-4 grid gap-3">
            {data.announcements.length === 0 && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
            {data.announcements.map((a) => (
              <article key={a.id} className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-600">{a.category}</p>
                <h3 className="mt-1 font-bold">{a.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{a.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Notices from admin */}
        {data.notices.length > 0 && (
          <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-blue-800">
              <BellRing className="size-5" /> Notices
            </h2>
            <div className="mt-4 grid gap-3">
              {data.notices.map((n) => (
                <article key={n.id} className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <h3 className="font-bold">{n.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{n.body}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Events */}
        <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-blue-800">
            <CalendarDays className="size-5" /> Events & activities
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.events.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events.</p>}
            {data.events.map((e) => (
              <article key={e.id} className="rounded-xl border border-blue-100 p-4">
                <h3 className="font-bold">{e.name}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{e.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {e.location ?? ''}
                  {e.programDate ? ` · ${new Date(e.programDate).toLocaleDateString('en-GB')}` : ''}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
