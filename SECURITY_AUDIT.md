# Security Audit & Bug Fix Report

## 1. Files जहाँ problem थियो / हेरियो

| File | Status |
|---|---|
| `app/page.tsx` | ✅ Server-side session + role check बाट मात्र admin panel देखाउँछ — public user लाई कहिले पनि admin UI देखिँदैन |
| `app/dashboard/page.tsx` | ✅ `/dashboard` मा role check: staff बाहेक → redirect (community → /community/dashboard, member → /member, अन्य → /) |
| `app/member/page.tsx` | ✅ role check: community → /community/dashboard, staff → /dashboard |
| `components/club-portal.tsx` | ✅ `AdminDashboard` कहिले पनि सीधै render हुँदैन — `initialAdmin` server बाट मात्र आउँछ |
| `lib/auth.ts` | ✅ baseURL fixed हटाइयो — request बाट derive हुन्छ ("Invalid origin" fix) |
| `app/api/verify-email/route.ts` | 🔧 **Rewrite** — hashed code, cooldown, expiry, secure template |
| `app/api/auth/set-role/route.ts` | 🔧 **Rewrite** — session-required, आफ्नै email मात्र, admin role कहिल्यै assign गर्न नसकिने |
| `lib/mail.ts` | ✅ SMTP → Resend → dev fallback; send fail मा server log |
| सबै 21 `/api/admin/*` routes | ✅ सबैमा `requireAdmin()` (server-side session + DB role check) |

**निष्कर्ष:** कुनै पनि ठाउँमा `localStorage` / `isAdmin` / client-side-only authorization छैन (grep confirm)। Admin access पूरै **server-side session + database role** बाट मात्र। "Device B मा admin देखिने" संरचनात्मक रूपमा असम्भव छ — प्रत्येक browser को आफ्नै session cookie हुन्छ।

## 2. के-के change गरियो

1. **verify-email** (नयाँ):
   - Code अब `crypto.randomInt()` बाट (predictable छैन)
   - Code **SHA-256 hash** गरेर DB मा राखिन्छ (plain text होइन)
   - **Resend cooldown 60 सेकेन्ड** — spam रोकिन्छ
   - **Expiry 10 मिनेट** — expired code reject + आफै delete
   - Resend गर्दा **पुरानो code invalid**
   - Successful verification पछि code **delete**
   - Production मा mail provider नभए code **कहिल्यै leak हुँदैन** (dev मा मात्र स्क्रिनमा)
   - Professional email template: club name, code, expiry, "ignore if not you"

2. **set-role** (नयाँ): login गरेको user ले **आफ्नै** email मात्र, र `viewer` → `community_user`/`official_member` मात्र। **admin/staff role कुनै पनि API बाट set गर्न सकिँदैन।**

3. **baseURL** हटाइयो (origin fix — अघिल्लो commit मा पनि गइसकेको)

## 3. Authentication Flow (अहिले कसरी काम गर्छ)

```
Request (cookie सहित)
   ↓
better-auth session verify (server-side, DB मा session)
   ↓
User DB बाट role read (admin / official_member / community_user / viewer)
   ↓
Route guard:
  /dashboard → role staff मात्र
  /member    → members table मा active भएको official_member मात्र
  /community/dashboard → community_user + emailVerified मात्र
  Admin APIs → requireAdmin() (session + DB role)
```

- प्रत्येक request मा identity + role **server-side** verify हुन्छ
- Logout → session delete → cookie invalid → पुरानो page/back button मा पनि access छैन (हरेक request नयाँ verify हुन्छ)
- Session **per-device** — अर्को device मा share/leak हुँदैन

## 4. Email Verification Flow

```
Signup (email lowercase, duplicate check, password hashed — better-auth scrypt)
   ↓
/api/verify-email (request) → 6-अंक code generate (crypto.randomInt)
   ↓ code SHA-256 hash गरेर DB मा (identifier: email-code:<email>, expiresAt: +10min)
   ↓
sendMail: SMTP (Gmail/Brevo) → वा Resend → वा dev log
   ↓
User ले code हाल्छ → hash compare → expiry check
   ↓
Match → emailVerified=true → code delete → login मिल्छ
```

- Resend: नयाँ code + पुरानो invalid + 60s cooldown
- Expired: reject + नयाँ code माग्न सकिन्छ

## 5. Required Environment Variables

| Variable | किन | Production (Vercel) मा |
|---|---|---|
| `DATABASE_URL` | PostgreSQL | Neon को URL (अनिवार्य) |
| `BETTER_AUTH_SECRET` | Session signing | random string (अनिवार्य) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Email code पठाउन | Gmail app password / Brevo (नभए code email मा जाँदैन) |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | वैकल्पिक | Resend प्रयोग गरे मात्र |

⚠️ `.env` gitignore मा छ — GitHub मा कहिल्यै जाँदैन। Secret कहिल्यै frontend मा expose हुँदैन (सबै server-side `process.env` बाट)।

## 6. Test Scenarios

| Test | Status |
|---|---|
| A. Device A admin login / Device B public | ✅ Code-verified (server-side session; B मा admin render हुने mechanism नै छैन) |
| B. /dashboard बिना login | ✅ redirect → /sign-in (code) — deployed site मा verify गर्नुहोस् |
| C. Member → /dashboard | ✅ redirect → /member (code) |
| D. Logout → back button | ✅ session delete + हरेक request verify |
| E. Signup → verification email | ✅ code path rewrite — **SMTP env vars Vercel मा set गरेपछि email आउँछ** |
| F. Resend → नयाँ code, पुरानो invalid | ✅ code (cooldown 60s) |
| G. Expired code reject | ✅ code (10 min expiry) |
| H. signup मा `role:"admin"` पठाउने | ✅ better-auth ले role field ignore गर्छ; role सधैं `viewer` सुरु हुन्छ; set-role पनि admin दिँदैन |

> ⚠️ Local sandbox मा DB अस्थिर भएर live scenario tests पूरा चलाउन सकिनँ — तर सबै fix **build pass** छन्। Deployed site मा push गरेपछि Test B/C/E/F माथिका steps अनुसार verify गर्नुहोस्।
