'use client'

import { useState } from 'react'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

// Official Member Signup — ORANGE theme.
// Strict rule: signup is ONLY allowed when the email exists in the admin
// member list AND its status is Active. Otherwise blocked with a clear message.
export default function MemberSignupPage() {
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
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupEmail, action: 'request' }),
      })
      const body = await res.json()
      setCodeInfo(
        res.ok
          ? body.dev
            ? `[dev] Code: ${body.dev}`
            : '६ अंकको code तपाईंको email मा पठाइयो।'
          : (body.error ?? 'Code पठाउन सकिएन।'),
      )
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
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupEmail, code: code.trim(), action: 'confirm' }),
      })
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

    // 1. Email MUST be approved by admin (in member list) and Active.
    const check = await fetch(`/api/member/check-email?email=${encodeURIComponent(email)}`)
    const checkBody = await check.json()
    if (!checkBody.listed) {
      setError('This email is not approved for an official member account. Please contact the administrator.')
      setLoading(false)
      return
    }
    if (checkBody.member && checkBody.member.status !== 'active') {
      setError('Your member email is currently inactive. Please contact the administrator.')
      setLoading(false)
      return
    }

    // 2. Create the account.
    const result = await authClient.signUp.email({
      name: String(form.get('name')),
      email,
      password: String(form.get('password')),
    })
    if (result.error) {
      const message = result.error.message || ''
      setError(
        message.toLowerCase().includes('already') || message.toLowerCase().includes('exist')
          ? 'यो email बाट account पहिले नै बनेको छ — Member login गर्नुहोस्।'
          : 'Account बनाउन सकिएन।',
      )
    } else {
      // 3. Assign the official_member role, then verify email by code.
      await fetch('/api/auth/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'official_member' }),
      }).catch(() => null)
      await authClient.signOut().catch(() => null)
      setSignupEmail(email)
      setCreated(true)
      requestCode()
    }
    setLoading(false)
  }

  const input =
    'w-full rounded-xl border border-orange-300 bg-background px-3 py-3 font-normal outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200'
  const primary =
    'rounded-xl bg-orange-600 px-4 py-3 font-bold text-white hover:bg-orange-700 disabled:opacity-60'

  if (created) {
    return (
      <main className="grid min-h-screen place-items-center bg-orange-50/70 px-5">
        <div className="w-full max-w-md rounded-3xl border border-orange-200 bg-card p-7 text-center shadow-xl">
          <CheckCircle2 className="mx-auto size-12 text-orange-600" />
          <h1 className="mt-4 text-2xl font-bold text-balance">Member account बनाइयो</h1>
          {!codeVerified ? (
            <div className="mt-4 rounded-2xl border border-orange-300 bg-orange-50 p-4 text-left">
              <p className="text-sm font-bold text-orange-800">Email verify गर्नुहोस् (६ अंकको code)</p>
              <p className="mt-1 text-xs text-muted-foreground">{signupEmail} मा code पठाइयो।</p>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="६ अंकको code"
                inputMode="numeric"
                maxLength={6}
                className="mt-3 w-full rounded-xl border bg-background px-3 py-2.5 text-center text-lg font-bold tracking-[0.4em] outline-none focus:border-orange-500"
              />
              <button type="button" onClick={confirmCode} disabled={codeBusy} className={`mt-2 w-full ${primary}`}>
                {codeBusy ? 'Checking…' : 'Verify code'}
              </button>
              <button type="button" onClick={requestCode} className="mt-2 w-full text-center text-xs font-semibold text-orange-700 underline">
                Code आएन? फेरि पठाउनुहोस्
              </button>
              {codeInfo && <p className="mt-2 text-xs leading-5 text-orange-800">{codeInfo}</p>}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-orange-300 bg-orange-50 p-4">
              <p className="text-sm font-bold text-orange-800">✅ Email verified!</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                तपाईंको email पहिले नै admin ले Active गरिसक्नुभएको छ — अब Member login गरेर आफ्नो dashboard खोल्नुहोस्।
              </p>
              <a href="/member-login" className={`mt-4 inline-block ${primary}`}>
                Go to member login
              </a>
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="grid min-h-screen place-items-center bg-orange-50/70 px-5 py-10">
      <form action={submit} className="flex w-full max-w-md flex-col gap-5 rounded-3xl border border-orange-200 bg-card p-7 shadow-2xl shadow-orange-200/50">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Official member portal</p>
          <h1 className="mt-3 text-4xl font-bold text-balance">Create member account</h1>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Full name
          <input name="name" required className={input} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Approved email (admin ले Active गरेको)
          <input name="email" type="email" required className={input} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Password
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              minLength={8}
              required
              className={`${input} pr-11`}
            />
            <button type="button" aria-label="Toggle password" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-3 text-muted-foreground">
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </label>
        {error && <p role="alert" className="rounded-xl bg-orange-100 p-3 text-sm font-semibold text-orange-800">{error}</p>}
        <button disabled={loading} className={primary}>
          {loading ? 'Creating…' : 'Create member account'}
        </button>
        <a href="/member-login" className="text-center text-sm font-semibold text-orange-700">
          Already a member? Login
        </a>
        <a href="/" className="text-center text-sm font-semibold text-muted-foreground">
          ← Back to home
        </a>
      </form>
    </main>
  )
}
