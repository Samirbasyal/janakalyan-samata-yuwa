'use client'

import { useState } from 'react'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

// Join Community signup — BLUE theme. Public users (not official members).
// Signup -> email verification (code) -> login -> Public Community Dashboard.
export default function CommunitySignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(false)
  const [code, setCode] = useState('')
  const [codeInfo, setCodeInfo] = useState('')
  const [codeBusy, setCodeBusy] = useState(false)
  const [codeVerified, setCodeVerified] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')

  async function requestCode() {
    if (!signupEmail) return
    setCodeBusy(true)
    setCodeInfo('')
    try {
      const res = await fetch('/api/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: signupEmail, action: 'request' }) })
      const body = await res.json()
      setCodeInfo(res.ok ? (body.dev ? `[dev] Code: ${body.dev}` : '६ अंकको code email मा पठाइयो।') : (body.error ?? 'Code पठाउन सकिएन।'))
    } catch {
      setCodeInfo('Code पठाउन सकिएन।')
    } finally {
      setCodeBusy(false)
    }
  }

  async function confirmCode() {
    if (!signupEmail || code.length < 4) return
    setCodeBusy(true)
    setCodeInfo('')
    try {
      const res = await fetch('/api/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: signupEmail, code: code.trim(), action: 'confirm' }) })
      const body = await res.json()
      if (res.ok) setCodeVerified(true)
      else setCodeInfo(body.error ?? 'Code मिलेन।')
    } catch {
      setCodeInfo('Code confirm गर्न सकिएन।')
    } finally {
      setCodeBusy(false)
    }
  }

  async function submit(form: FormData) {
    setLoading(true)
    setError('')
    const email = String(form.get('email')).trim().toLowerCase()
    const typeRes = await fetch(`/api/auth/check-login-type?email=${encodeURIComponent(email)}`)
    const type = await typeRes.json()
    if (type.type === 'admin') {
      setError('Incorrect Login Type — This is an Admin ID. Please use the Admin Login.')
      setLoading(false)
      return
    }
    if (type.type === 'official_member') {
      setError('This email belongs to an Official Member. Please use the Member Login.')
      setLoading(false)
      return
    }
    const result = await authClient.signUp.email({ name: String(form.get('name')), email, password: String(form.get('password')) })
    if (result.error) {
      const message = result.error.message || ''
      setError(message.toLowerCase().includes('already') || message.toLowerCase().includes('exist') ? 'यो email बाट account पहिले नै छ — Community login गर्नुहोस्।' : 'Account बनाउन सकिएन।')
    } else {
      await fetch('/api/auth/set-role', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role: 'community_user' }) }).catch(() => null)
      await authClient.signOut().catch(() => null)
      setSignupEmail(email)
      setCreated(true)
      requestCode()
    }
    setLoading(false)
  }

  const input = 'w-full rounded-xl border border-blue-300 bg-background px-3 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
  const primary = 'rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60'

  if (created) {
    return (
      <main className="grid min-h-screen place-items-center bg-blue-50/70 px-5">
        <div className="w-full max-w-md rounded-3xl border border-blue-200 bg-card p-7 text-center shadow-xl">
          <CheckCircle2 className="mx-auto size-12 text-blue-600" />
          <h1 className="mt-4 text-2xl font-bold text-balance">Community account बनाइयो</h1>
          {!codeVerified ? (
            <div className="mt-4 rounded-2xl border border-blue-300 bg-blue-50 p-4 text-left">
              <p className="text-sm font-bold text-blue-800">Email verify गर्नुहोस् (६ अंकको code)</p>
              <p className="mt-1 text-xs text-muted-foreground">{signupEmail} मा code पठाइयो।</p>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="६ अंकको code" inputMode="numeric" maxLength={6} className="mt-3 w-full rounded-xl border bg-background px-3 py-2.5 text-center text-lg font-bold tracking-[0.4em] outline-none focus:border-blue-500" />
              <button type="button" onClick={confirmCode} disabled={codeBusy} className={`mt-2 w-full ${primary}`}>{codeBusy ? 'Checking…' : 'Verify code'}</button>
              <button type="button" onClick={requestCode} className="mt-2 w-full text-center text-xs font-semibold text-blue-700 underline">Code आएन? फेरि पठाउनुहोस्</button>
              {codeInfo && <p className="mt-2 text-xs leading-5 text-blue-800">{codeInfo}</p>}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-blue-300 bg-blue-50 p-4">
              <p className="text-sm font-bold text-blue-800">✅ Email verified!</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">अब Community login गरेर आफ्नो dashboard खोल्नुहोस्।</p>
              <a href="/community-login" className={`mt-4 inline-block ${primary}`}>Go to community login</a>
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="grid min-h-screen place-items-center bg-blue-50/70 px-5 py-10">
      <form action={submit} className="flex w-full max-w-md flex-col gap-5 rounded-3xl border border-blue-200 bg-card p-7 shadow-2xl shadow-blue-200/50">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Join community</p>
          <h1 className="mt-3 text-4xl font-bold text-balance">Community signup</h1>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Full name
          <input name="name" required className={input} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Email
          <input name="email" type="email" required className={input} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Password
          <div className="relative">
            <input name="password" type={showPassword ? 'text' : 'password'} minLength={8} required className={`${input} pr-11`} />
            <button type="button" aria-label="Toggle password" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-3 text-muted-foreground">
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </label>
        {error && <p role="alert" className="rounded-xl bg-blue-100 p-3 text-sm font-semibold text-blue-800">{error}</p>}
        <button disabled={loading} className={primary}>{loading ? 'Creating…' : 'Create community account'}</button>
        <a href="/community-login" className="text-center text-sm font-semibold text-blue-700">Already joined? Community login</a>
        <a href="/" className="text-center text-sm font-semibold text-muted-foreground">← Back to home</a>
      </form>
    </main>
  )
}
