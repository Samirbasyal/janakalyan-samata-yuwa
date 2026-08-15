# जनकल्याण समता युवा क्लब — Janakalyan Samata Yuwa Club Website

Full-stack community/club portal for the youth club of **Khaptad Chhanna-3, Bajhang, Nepal**.
Built as a same-design rebuild of the reference project with an upgraded admin control panel.

## Tech stack

- **Next.js 16 (App Router) + TypeScript**
- **Tailwind CSS v4** — OKLCH theme (teal-dark primary, gold accent, cream background), shadcn-style components
- **Drizzle ORM + PostgreSQL** (`node-postgres` driver)
- **better-auth** — email/password, session-based, role-based redirects
- **PGlite + pglite-socket** for local development — a real PostgreSQL 16 engine (WASM) exposing a TCP socket, so the app connects with a normal `postgres://` URL. Swap to any hosted Postgres (Neon/Supabase/Vercel Postgres) by changing `DATABASE_URL`.
- Fonts: Geist (Latin) + Noto Sans Devanagari (Nepali)

## Features

### Public website (single page, bilingual)
Header · member-panel strip · hero with stat counters · About (mission + 4 feature cards) · Our Works (live) · Programs (live) · Announcements + public admin **notices** + Gallery · Donate form (multi-bank QR) · Our Donors (public band) · Members directory (committee from live data, अध्यक्ष highlighted) · Join us form · Footer

### Authentication & roles
- Staff roles: `admin`, `treasurer`, `editor` → `/dashboard`
- Member accounts: `/member-signup` → **pending admin approval** → admin activates → login allowed; inactive login shows "Your account is pending admin approval"

### Admin dashboard (`/dashboard`)
- Auto stat cards: confirmed income, expenses, **remaining balance**, all-balance, pending donations (amount+count), active members, works, programs, pending applications
- Module CRUD (add/edit/delete + search + CSV export/import): Members, Website content, Works, Programs, Expenses, Donations, Applications, Gallery, Announcements, Contact messages
- **कार्यसमिति (Committee)** management — public Members section syncs automatically
- **Banks & QR** — add N bank accounts with per-bank QR upload; forms show the selected bank's QR
- **Monthly fund panel** — per-member Paid/Pending/Unpaid, approve/reject member-submitted payments
- **Loan register** — loans + partial returns + live outstanding balance
- **Payment QR settings** — legacy default bank + eSewa QR
- **Visibility control panel** — every record (member, donation, expense, content, gallery, announcement, program, work, loan, monthly fund, note, committee) toggles Public / Members only / Private / Admin only, with confirmation before making sensitive data public; per-row quick visibility dropdown in module tables
- **Admin notes** — private notes with **Public / Admin only** visibility; public notes appear on the website notice section
- **Club Records** — financial ledger: total income (chanda), total expenses, remaining balance; add/edit/delete records, per-record Public/Admin-only visibility (confirm warning before making public), public records shown in the website's आर्थिक अभिलेख section
- **Notifications** — bell + unread badge + list; payment submissions notify instantly; click jumps to the payment row
- **Messages** — group chat (all active members + staff) and 1-to-1 member↔admin chat with unread badges, persisted

### Member dashboard (`/member`)
My workspace (notes / work / plan / achievements) · Monthly fund payment (method + bank → matching QR, submit → **Pending**) · Payment history (Pending stays Pending until admin approves) · Messages/Chat (group + admin)

## Getting started

Requirements: Node.js ≥ 20.9, npm.

```bash
npm install

# 1. Start the local database (PGlite socket server on 5432)
npm run db:start        # keep this terminal running

# 2. In another terminal — create tables + seed sample data
npm run db:init

# 3. Configure environment
#    .env is already provided for local dev; adjust BETTER_AUTH_SECRET for production.

# 4. Run the app
npm run dev             # http://localhost:3000
```

### First admin account

1. Visit `/sign-up` and create a staff account (role defaults to `viewer` — cannot access admin yet).
2. Promote it:
   ```bash
   npm run promote:admin your@email.com admin   # or treasurer / editor
   ```
3. Sign in at `/sign-in` → you land on the admin dashboard.

### Member flow (test)

1. Anyone can join: the **Join as a member** form or `/member-signup` works without any prior admin action — a `pending` member record is created automatically (no email activation required to join).
2. Admin → **Create Member** panel (Members module) → sees the pending member → **Activate**. Only after activation can the member sign in and use the dashboard.
3. Member verifies email (mandatory) → signs in at `/sign-in`.
4. Member submits a monthly fund payment → admin bell notification → approve in Monthly fund panel → member history shows **Paid**.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run db:start` | Start local PGlite PostgreSQL (port 5432) |
| `npm run db:init` | Create all tables + seed reference content (idempotent) |
| `node scripts/migrate.mjs` | One-off column/table migrations (run if DB was created before the latest schema) |
| `npm run promote:admin <email> [role]` | Promote a user to admin/treasurer/editor |
| `node scripts/verify-email.mjs <email>` | Mark a user's email verified (dev; production sends real verification emails via Resend) |

## Email verification

- `requireEmailVerification` is **on** — sign-up without verifying the email cannot sign in (`EMAIL_NOT_VERIFIED`); the sign-in page shows a "Resend verification email" button.
- Production: set `RESEND_API_KEY` + `RESEND_FROM_EMAIL` to send real verification links.
- Local dev without Resend: the verification link is printed to the server console, or mark a user verified with `node scripts/verify-email.mjs <email>`. Member accounts additionally need admin **Activate** after verification.

## Deployment

- Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` in the host (Vercel etc.).
- Optional: `RESEND_API_KEY` (password reset emails), `GOOGLE_CLIENT_ID/SECRET` (social login).
- Local PGlite is for development only — use a hosted PostgreSQL in production.
