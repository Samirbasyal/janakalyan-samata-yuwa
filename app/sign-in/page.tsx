'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Eye, EyeOff } from 'lucide-react'

const STAFF_ROLES = ['admin', 'treasurer', 'editor']

export default function SignInPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [unverified, setUnverified] = useState(false)
  const [code, setCode] = useState('')
  const [codeStatus, setCodeStatus] = useState<'idle' | 'sending' | 'sent' | 'error' | 'verified'>('idle')
  const [info, setInfo] = useState('')

  // Request a 6-digit verification code to the email
  async function getCode() {
    if (!email) return
    setCodeStatus('sending')
    setInfo('')
    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: 'request' }),
      })
      const body = await res.json()
      if (res.ok) {
        setCodeStatus('sent')
        setInfo(
          body.dev
            ? `[dev] Code पठाइयो — server console मा हेर्नुहोस्: ${body.dev}`
            : '६ अंकको verification code तपाईंको email मा पठाइयो।',
        )
      } else {
        setCodeStatus('error')
        setInfo(body.error ?? 'Code पठाउन सकिएन।')
      }
    } catch {
      setCodeStatus('error')
      setInfo('Code पठाउन सकिएन।')
    }
  }

  // Confirm the code → email becomes verified
  async function verifyCode() {
    if (!email || code.length < 4) return
    setCodeStatus('sending')
    setInfo('')
    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim(), action: 'confirm' }),
      })
      const body = await res.json()
      if (res.ok) {
        setCodeStatus('verified')
        setUnverified(false)
        setInfo('✅ Email verified! अब फेरि "Sign in securely" थिच्नुहोस्।')
      } else {
        setCodeStatus('sent')
        setInfo(body.error ?? 'Code मिलेन। फेरि प्रयास गर्नुहोस्।')
      }
    } catch {
      setCodeStatus('sent')
      setInfo('Code confirm गर्न सकिएन।')
    }
  }

  async function submit(form: FormData) {
    setLoading(true)
    setError('')
    const email = String(form.get('email')).trim().toLowerCase()
    setEmail(email)
    const result = await authClient.signIn.email({
      email,
      password: String(form.get('password')),
    })
    if (result.error) {
      const code = (result.error as { code?: string })?.code ?? ''
      const message = result.error.message || 'Unable to sign in'
      if (code === 'EMAIL_NOT_VERIFIED' || message.toLowerCase().includes('email not verified')) {
        setError(
          'तपाईंको email अहिलेसम्म verify भएको छैन। तल "Get verification code" थिचेर email मा आएको ६ अंकको code हाल्नुहोस्।',
        )
        setUnverified(true)
        setCodeStatus('idle')
      } else {
        setError(message)
      }
      setLoading(false)
      return
    }

    // 1) Staff accounts (admin/treasurer/editor) always go to the dashboard —
    //    the member "pending approval" gate must NOT block them.
    const session = await authClient.getSession()
    const role = (session?.data?.user as { role?: string } | undefined)?.role
    if (role && STAFF_ROLES.includes(role)) {
      router.push('/dashboard')
      router.refresh()
      setLoading(false)
      return
    }

    // 2) Member accounts: dashboard only after admin activates the email.
    try {
      const check = await fetch(`/api/member/check-email?email=${encodeURIComponent(email)}`, {
        cache: 'no-store',
      })
      const checkBody = await check.json()
      if (checkBody.listed && checkBody.member && checkBody.member.status !== 'active') {
        await authClient.signOut()
        setError(
          'Your account is pending admin approval. Admin ले तपाईंको account Active गरेपछि मात्र login गर्न सकिन्छ।',
        )
        setLoading(false)
        return
      }
      if (checkBody.listed && checkBody.member && checkBody.member.status === 'active') {
        router.push('/member')
        router.refresh()
        return
      }
    } catch {
      // fall through to default redirect
    }
    router.push('/')
    router.refresh()
    setLoading(false)
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-secondary/60 via-background to-accent/10 px-5 py-10">
      <form
        action={submit}
        className="flex w-full max-w-md flex-col gap-5 rounded-3xl border border-border/80 bg-card p-7 shadow-2xl shadow-primary/10"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Staff portal</p>
          <h1 className="mt-3 font-serif text-4xl font-bold">Admin sign in</h1>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Email
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-3 font-normal outline-none focus:border-primary"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Password
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-3 pr-11 font-normal outline-none focus:border-primary"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute inset-y-0 right-3 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </label>
        {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {unverified && (
          <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4">
            <p className="text-xs font-bold text-accent-foreground">Email verification (code)</p>
            {codeStatus !== 'verified' ? (
              <>
                {codeStatus === 'idle' && (
                  <button
                    type="button"
                    onClick={getCode}
                    className="mt-2 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground"
                  >
                    Get verification code
                  </button>
                )}
                {codeStatus === 'sent' && (
                  <>
                    <input
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="६ अंकको code"
                      inputMode="numeric"
                      maxLength={6}
                      className="mt-2 w-full rounded-xl border bg-background px-3 py-2.5 text-center text-lg font-bold tracking-[0.4em] outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={verifyCode}
                      disabled={codeStatus === 'sending'}
                      className="mt-2 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground disabled:opacity-60"
                    >
                      {codeStatus === 'sending' ? 'Checking…' : 'Verify code'}
                    </button>
                    <button
                      type="button"
                      onClick={getCode}
                      className="mt-2 w-full text-center text-xs font-semibold text-accent-foreground underline"
                    >
                      Code आएन? फेरि पठाउनुहोस्
                    </button>
                  </>
                )}
              </>
            ) : null}
            {info && <p className="mt-2 text-xs leading-5 text-accent-foreground">{info}</p>}
          </div>
        )}
        <button disabled={loading} className="rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-60">
          {loading ? 'Signing in…' : 'Sign in securely'}
        </button>
        <a href="/forgot-password" className="text-center text-sm font-semibold text-primary">
          Forgot password?
        </a>
        <a href="/sign-up" className="text-center text-sm font-semibold text-muted-foreground">
          Create a staff account
        </a>
        <a href="/member-signup" className="text-center text-sm font-semibold text-primary">
          Club member? Create member account
        </a>
        <button
          type="button"
          onClick={() => setError('Google sign in requires configuration in the admin settings.')}
          className="rounded-xl border px-4 py-3 font-bold"
        >
          Continue with Google
        </button>
      </form>
    </main>
  )
}
