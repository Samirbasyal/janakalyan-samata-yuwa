'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Eye, EyeOff } from 'lucide-react'

// Official Member Login — ORANGE theme. Admin email / community accounts are
// rejected with a clear "wrong login type" message.
export default function MemberLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [unverified, setUnverified] = useState(false)
  const [code, setCode] = useState('')
  const [codeStatus, setCodeStatus] = useState<'idle' | 'sending' | 'sent' | 'verified'>('idle')
  const [info, setInfo] = useState('')

  async function getCode() {
    if (!email) return
    setCodeStatus('sending')
    setInfo('')
    try {
      const res = await fetch('/api/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, action: 'request' }) })
      const body = await res.json()
      if (res.ok) {
        setCodeStatus('sent')
        setInfo(body.dev ? `[dev] Code: ${body.dev}` : '६ अंकको code email मा पठाइयो।')
      } else {
        setCodeStatus('idle')
        setInfo(body.error ?? 'Code पठाउन सकिएन।')
      }
    } catch {
      setCodeStatus('idle')
      setInfo('Code पठाउन सकिएन।')
    }
  }

  async function verifyCode() {
    if (!email || code.length < 4) return
    setCodeStatus('sending')
    setInfo('')
    try {
      const res = await fetch('/api/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code: code.trim(), action: 'confirm' }) })
      const body = await res.json()
      if (res.ok) {
        setCodeStatus('verified')
        setUnverified(false)
        setInfo('✅ Email verified! अब फेरि Login थिच्नुहोस्।')
      } else {
        setCodeStatus('sent')
        setInfo(body.error ?? 'Code मिलेन।')
      }
    } catch {
      setCodeStatus('sent')
      setInfo('Code confirm गर्न सकिएन।')
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    const normalized = email.trim().toLowerCase()

    // Detect which system this email belongs to — block cross-login attempts.
    const typeRes = await fetch(`/api/auth/check-login-type?email=${encodeURIComponent(normalized)}`)
    const type = await typeRes.json()
    if (type.type === 'admin') {
      setError('Incorrect Login Type — This is an Admin ID. Please use the Admin Login.')
      setLoading(false)
      return
    }
    if (type.type === 'community') {
      setError('This account belongs to a Community user. Please use the Community Login.')
      setLoading(false)
      return
    }
    if (type.type === 'official_member' && type.memberStatus !== 'active') {
      setError('Your member account is currently inactive. Please contact the administrator.')
      setLoading(false)
      return
    }
    if (type.type === 'none') {
      setError('Member account भेटिएन — पहिले Admin ले तपाईंको email Active गरेको हुनुपर्छ, अनि signup गर्नुहोस्।')
      setLoading(false)
      return
    }

    const result = await authClient.signIn.email({ email: normalized, password })
    if (result.error) {
      const code = (result.error as { code?: string })?.code ?? ''
      const message = result.error.message || 'Unable to sign in'
      if (code === 'EMAIL_NOT_VERIFIED' || message.toLowerCase().includes('email not verified')) {
        setError('Please verify your email address before continuing.')
        setUnverified(true)
        setCodeStatus('idle')
      } else {
        setError(message)
      }
      setLoading(false)
      return
    }
    router.push('/member')
    router.refresh()
  }

  const input = 'w-full rounded-xl border border-orange-300 bg-background px-3 py-3 font-normal outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200'
  const primary = 'rounded-xl bg-orange-600 px-4 py-3 font-bold text-white hover:bg-orange-700 disabled:opacity-60'

  return (
    <main className="grid min-h-screen place-items-center bg-orange-50/70 px-5 py-10">
      <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-5 rounded-3xl border border-orange-200 bg-card p-7 shadow-2xl shadow-orange-200/50">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Official member portal</p>
          <h1 className="mt-3 font-serif text-4xl font-bold">Member login</h1>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Password
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} pr-11`} />
            <button type="button" aria-label="Toggle password" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-3 text-muted-foreground">
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </label>
        {error && <p role="alert" className="rounded-xl bg-orange-100 p-3 text-sm font-semibold text-orange-800">{error}</p>}
        {unverified && (
          <div className="rounded-2xl border border-orange-300 bg-orange-50 p-4">
            {codeStatus !== 'verified' ? (
              <>
                {codeStatus === 'idle' && (
                  <button type="button" onClick={getCode} className={`w-full ${primary}`}>Get verification code</button>
                )}
                {codeStatus === 'sent' && (
                  <>
                    <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="६ अंकको code" inputMode="numeric" maxLength={6} className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-center text-lg font-bold tracking-[0.4em] outline-none focus:border-orange-500" />
                    <button type="button" onClick={verifyCode} disabled={codeStatus === 'sending'} className={`mt-2 w-full ${primary}`}>
                      {codeStatus === 'sending' ? 'Checking…' : 'Verify code'}
                    </button>
                    <button type="button" onClick={getCode} className="mt-2 w-full text-center text-xs font-semibold text-orange-700 underline">
                      Code आएन? फेरि पठाउनुहोस्
                    </button>
                  </>
                )}
              </>
            ) : null}
            {info && <p className="mt-2 text-xs leading-5 text-orange-800">{info}</p>}
          </div>
        )}
        <button disabled={loading} className={primary}>{loading ? 'Signing in…' : 'Member login'}</button>
        <a href="/member-signup" className="text-center text-sm font-semibold text-orange-700">
          New member? Create account (admin approval required)
        </a>
        <a href="/forgot-password" className="text-center text-sm font-semibold text-muted-foreground">Forgot password?</a>
        <a href="/" className="text-center text-sm font-semibold text-muted-foreground">← Back to home</a>
      </form>
    </main>
  )
}
