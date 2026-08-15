// Initialize the club database: creates all tables (idempotent) and seeds
// the same starter content the reference site shows (committee, members,
// works, programs, donations, content sections).
//
// Run: npm run db:init   (uses DATABASE_URL from .env, defaults to local PGlite)
import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Load .env manually (plain key=value) so this script works without dotenv
const envFile = path.join(root, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres";
const client = new pg.Client({ connectionString: url });

// Inline literal helpers (seed data is static/trusted)
const s = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const n = (v) => (v === null || v === undefined ? "NULL" : String(Number(v)));
const b = (v) => (v ? "true" : "false");
const ts = (v) => (v ? s(new Date(v).toISOString()) : "NULL");
const uuid = () => crypto.randomUUID();

const TABLES = [
  `CREATE TABLE IF NOT EXISTS club_members (
    id text primary key,
    name text not null,
    role text not null,
    ward text,
    phone text,
    email text,
    status text not null default 'active',
    joined_at timestamp not null default now(),
    updated_at timestamp not null default now()
  )`,
  `CREATE TABLE IF NOT EXISTS club_content (
    id text primary key,
    section text not null unique,
    title text not null,
    body text not null,
    updated_at timestamp not null default now(),
    updated_by text
  )`,
  `CREATE TABLE IF NOT EXISTS club_donations (
    id text primary key,
    donor text not null,
    amount integer not null,
    purpose text not null,
    method text not null,
    reference text,
    donor_photo_url text,
    donor_photo_pathname text,
    donor_phone text,
    donor_email text,
    receipt_number text,
    status text not null default 'pending',
    is_public boolean not null default false,
    received_at timestamp not null default now(),
    created_by text not null
  )`,
  `CREATE TABLE IF NOT EXISTS club_expenses (
    id text primary key,
    title text not null,
    amount integer not null,
    purpose text not null,
    receipt_url text,
    spent_at timestamp not null default now(),
    created_by text not null
  )`,
  `CREATE TABLE IF NOT EXISTS club_applications (
    id text primary key,
    name text not null,
    phone text not null,
    email text,
    message text,
    status text not null default 'pending',
    created_at timestamp not null default now()
  )`,
  `CREATE TABLE IF NOT EXISTS club_works (
    id text primary key,
    title text not null,
    description text not null,
    location text,
    responsible text,
    status text not null default 'pending',
    budget integer default 0,
    actual_expense integer default 0,
    work_date timestamp,
    photo_url text,
    created_by text not null
  )`,
  `CREATE TABLE IF NOT EXISTS club_programs (
    id text primary key,
    name text not null,
    description text not null,
    location text,
    organized_by text,
    responsible text,
    budget integer default 0,
    actual_expense integer default 0,
    status text not null default 'upcoming',
    program_date timestamp,
    photo_url text,
    created_by text not null
  )`,
  `CREATE TABLE IF NOT EXISTS club_gallery (
    id text primary key,
    title text not null,
    description text,
    category text not null,
    image_url text not null,
    taken_at timestamp,
    created_by text not null
  )`,
  `CREATE TABLE IF NOT EXISTS club_announcements (
    id text primary key,
    title text not null,
    body text not null,
    category text not null,
    published boolean not null default true,
    created_at timestamp not null default now(),
    created_by text not null
  )`,
  `CREATE TABLE IF NOT EXISTS club_audit_logs (
    id text primary key,
    action text not null,
    entity text not null,
    entity_id text,
    admin_id text not null,
    created_at timestamp not null default now()
  )`,
  `CREATE TABLE IF NOT EXISTS club_contact_messages (
    id text primary key,
    name text not null,
    email text not null,
    phone text,
    message text not null,
    status text not null default 'new',
    created_at timestamp not null default now()
  )`,
  `CREATE TABLE IF NOT EXISTS club_membership_profiles (
    id text primary key,
    application_id text not null,
    date_of_birth text,
    gender text,
    address text,
    education text,
    occupation text,
    skills text,
    emergency_contact text,
    profile_photo_url text
  )`,
  `CREATE TABLE IF NOT EXISTS admin_notes (
    id text primary key,
    title text not null,
    content text not null,
    visibility text not null default 'admin',
    created_by text not null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
  )`,
  `CREATE TABLE IF NOT EXISTS loans (
    id text primary key,
    borrower text not null,
    amount integer not null,
    purpose text not null,
    loan_date timestamp not null default now(),
    due_date timestamp,
    notes text,
    status text not null default 'active',
    agreement_text text,
    agreement_photo_path text,
    created_by text not null
  )`,
  `CREATE TABLE IF NOT EXISTS loan_returns (
    id text primary key,
    loan_id text not null,
    amount integer not null,
    return_date timestamp not null default now(),
    notes text,
    created_by text not null
  )`,
  `CREATE TABLE IF NOT EXISTS monthly_member_contributions (
    id text primary key,
    member_id text not null,
    member_name text not null,
    collection_month text not null,
    amount integer not null default 20,
    status text not null default 'unpaid',
    paid_at timestamp,
    payment_method text,
    payment_reference text,
    payment_proof_url text,
    submitted_at timestamp,
    approved_at timestamp,
    approved_by text,
    collected_by text,
    remarks text,
    receipt_number text,
    updated_at timestamp not null default now(),
    created_at timestamp not null default now()
  )`,
  `CREATE TABLE IF NOT EXISTS committee_records (
    id text primary key,
    member_name text not null,
    position text not null,
    responsibilities text,
    work_details text,
    work_count integer not null default 0,
    achievements text,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
  )`,
  `CREATE TABLE IF NOT EXISTS member_workspace_items (
    id text primary key,
    member_id text not null,
    item_type text not null,
    title text not null,
    details text,
    event_date timestamp,
    is_public boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
  )`,
  `CREATE TABLE IF NOT EXISTS payment_settings (
    id text primary key,
    bank_qr_url text,
    esewa_qr_url text,
    updated_at timestamp not null default now(),
    updated_by text
  )`,
  `CREATE TABLE IF NOT EXISTS club_records (
    id text primary key, type text not null, title text not null, amount integer not null default 0,
    category text, record_date timestamp not null default now(), notes text,
    created_by text not null, created_at timestamp not null default now(),
    updated_at timestamp not null default now()
  )`,
  `CREATE TABLE IF NOT EXISTS content_visibility (
    id text primary key,
    entity_type text not null,
    record_id text not null,
    visibility text not null default 'public',
    updated_by text,
    updated_at timestamp not null default now()
  )`,
  `CREATE TABLE IF NOT EXISTS bank_accounts (
    id text primary key,
    name text not null,
    account_holder text,
    account_number text,
    qr_url text,
    is_active boolean not null default true,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
  )`,
  `CREATE TABLE IF NOT EXISTS club_notifications (
    id text primary key,
    type text not null,
    title text not null,
    body text not null,
    entity_type text,
    entity_id text,
    recipient_role text not null default 'admin',
    is_read boolean not null default false,
    created_at timestamp not null default now()
  )`,
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id text primary key,
    sender_id text not null,
    sender_name text not null,
    channel text not null default 'group',
    thread_key text not null default 'group',
    recipient_id text,
    message text not null,
    created_at timestamp not null default now()
  )`,
  `CREATE TABLE IF NOT EXISTS chat_reads (
    user_id text not null,
    thread_key text not null,
    last_read_at timestamp not null default now(),
    PRIMARY KEY (user_id, thread_key)
  )`,
];

// ---- Seed data (same starter content as the reference site) ----
function seedMembers() {
  const committee = [
    ["Samir Sharki", "अध्यक्ष"],
    ["Yokendra Sharki", "उपाध्यक्ष"],
    ["Payal Sarki", "सचिव"],
    ["Priya Sharki", "सह-सचिव"],
    ["Umesh Sharki", "कोषाध्यक्ष"],
    ["Kapil Sharki", "सह-कोषाध्यक्ष"],
    ["Mahesh Sharki", "खेलकुद संयोजक"],
  ];
  const general = ["Subita","Anish","Dilip","Kuldip","Namita","Anita","Bishal","Batu","Piuli","Manoj","Sachin","Amir","Parbin","Akasha","Bimala","Bipana","Gabbar","Rajendra","Kamala","Nisha","Jhalak","Dipendra","Sarmila","Parmisha","Pardip","Santosh","Sunita","Rabindra","Sarya","Samir","Dhirendra","Birendra","Antim","Laxmi","Dinesh","Ashok"];
  const rows = [
    ...committee.map(([name, role]) => ({ id: uuid(), name, role, status: "active", ward: "3", phone: null, email: null })),
    ...general.map((name) => ({ id: uuid(), name, role: "Member", status: "active", ward: null, phone: null, email: null })),
  ];
  const values = rows.map((r) => `(${s(r.id)}, ${s(r.name)}, ${s(r.role)}, ${s(r.ward)}, ${s(r.phone)}, ${s(r.email)}, ${s(r.status)}, now(), now())`).join(",");
  return `INSERT INTO club_members (id, name, role, ward, phone, email, status, joined_at, updated_at) VALUES ${values}`;
}

function seedCommittee() {
  const rows = [
    { memberName: "Samir Sharki", position: "अध्यक्ष", responsibilities: "क्लबको समग्र नेतृत्व र योजना", workCount: 12, achievements: "समुदायमा सरसफाइ अभियानको नेतृत्व", workDetails: "गाउँ बाटो सरसफाइ, सामाजिक जनचेतना" },
    { memberName: "Yokendra Sharki", position: "उपाध्यक्ष", responsibilities: "उपाध्यक्षको जिम्मेवारी", workCount: 10, achievements: "युवा संगठन विस्तार", workDetails: "कार्यक्रम व्यवस्थापन" },
    { memberName: "Payal Sarki", position: "सचिव", responsibilities: "रेकर्ड र पत्राचार", workCount: 9, achievements: "पारदर्शी अभिलेख", workDetails: "बैठक व्यवस्थापन" },
    { memberName: "Priya Sharki", position: "सह-सचिव", responsibilities: "सचिवको सहयोग", workCount: 8, achievements: "महिला सहभागिता", workDetails: "कार्यक्रम समन्वय" },
    { memberName: "Umesh Sharki", position: "कोषाध्यक्ष", responsibilities: "कोष व्यवस्थापन", workCount: 11, achievements: "पारदर्शी कोष", workDetails: "मासिक कोष सङ्कलन" },
    { memberName: "Kapil Sharki", position: "सह-कोषाध्यक्ष", responsibilities: "कोषाध्यक्षको सहयोग", workCount: 7, achievements: "लेखा परीक्षण", workDetails: "खर्च अभिलेख" },
    { memberName: "Mahesh Sharki", position: "खेलकुद संयोजक", responsibilities: "खेलकुद कार्यक्रम", workCount: 6, achievements: "युवा खेलकुद मिलन", workDetails: "खेलकुद आयोजना" },
  ];
  const values = rows.map((r) => `(${s(uuid())}, ${s(r.memberName)}, ${s(r.position)}, ${s(r.responsibilities)}, ${s(r.workDetails)}, ${n(r.workCount)}, ${s(r.achievements)}, now(), now())`).join(",");
  return `INSERT INTO committee_records (id, member_name, position, responsibilities, work_details, work_count, achievements, created_at, updated_at) VALUES ${values}`;
}

function seedWorks() {
  const rows = [
    { title: "गाउँका बाटोहरू सरसफाइ", description: "युवा सहभागितामा मुख्य गाउँ बाटो र सार्वजनिक चौक सफा गरियो।", location: "Khaptad Chhanna-3", status: "completed", workDate: "2026-05-01" },
    { title: "आवश्यक सामुदायिक औजार सहयोग", description: "समुदायका लागि आवश्यक tools/equipment उपलब्ध गराइएको।", location: "Bajhang", status: "completed", workDate: "2026-05-20" },
    { title: "सामाजिक जनचेतना अभियान", description: "स्वच्छता, समानता र युवा सहभागिताबारे सचेतना कार्यक्रम।", location: "Khaptad Chhanna", status: "in_progress", workDate: "2026-06-10" },
  ];
  const values = rows.map((r) => `(${s(uuid())}, ${s(r.title)}, ${s(r.description)}, ${s(r.location)}, NULL, ${s(r.status)}, 0, 0, ${ts(r.workDate)}, NULL, ${s("seed")})`).join(",");
  return `INSERT INTO club_works (id, title, description, location, responsible, status, budget, actual_expense, work_date, photo_url, created_by) VALUES ${values}`;
}

function seedPrograms() {
  const rows = [
    { name: "स्वच्छ गाउँ, स्वस्थ समाज", description: "सफा गाउँ अभियान र सामुदायिक सहभागिता कार्यक्रम।", location: "Khaptad Chhanna-3", status: "Environmental", programDate: "2026-09-01" },
    { name: "युवा खेलकुद मिलन", description: "स्थानीय युवाहरूबीच मैत्रीपूर्ण खेलकुद कार्यक्रम।", location: "Bajhang", status: "Sports", programDate: "2026-09-20" },
    { name: "समता संवाद", description: "सामाजिक समानता र नेतृत्व विकास संवाद।", location: "Khaptad Chhanna", status: "Awareness", programDate: "2026-10-05" },
  ];
  const values = rows.map((r) => `(${s(uuid())}, ${s(r.name)}, ${s(r.description)}, ${s(r.location)}, NULL, NULL, 0, 0, ${s(r.status)}, ${ts(r.programDate)}, NULL, ${s("seed")})`).join(",");
  return `INSERT INTO club_programs (id, name, description, location, organized_by, responsible, budget, actual_expense, status, program_date, photo_url, created_by) VALUES ${values}`;
}

function seedDonations() {
  const rows = [
    { donor: "Ram Sharki", amount: 5000, purpose: "Poor Family Support", method: "Cash", status: "verified", isPublic: true, receivedAt: "2026-04-01" },
    { donor: "ABC Organization", amount: 10000, purpose: "Road Cleaning", method: "Bank Transfer", status: "received", isPublic: true, receivedAt: "2026-04-15" },
    { donor: "Hari Bahadur", amount: 2500, purpose: "Youth Development", method: "eSewa", status: "verified", isPublic: false, receivedAt: "2026-04-20" },
    { donor: "Dhan Maya Sarki", amount: 7500, purpose: "Sports Program", method: "Cash", status: "verified", isPublic: true, receivedAt: "2026-05-01" },
  ];
  const values = rows.map((r) => `(${s(uuid())}, ${s(r.donor)}, ${n(r.amount)}, ${s(r.purpose)}, ${s(r.method)}, NULL, NULL, NULL, NULL, ${s(r.status)}, ${b(r.isPublic)}, ${ts(r.receivedAt)}, ${s("seed")})`).join(",");
  return `INSERT INTO club_donations (id, donor, amount, purpose, method, reference, donor_phone, donor_email, receipt_number, status, is_public, received_at, created_by) VALUES ${values}`;
}

function seedContent() {
  const rows = [
    { section: "mission", title: "हाम्रो मिशन", body: "दलित, महिला तथा पछाडि पारिएका समुदायका लागि न्याय, सहयोग र समान अवसरको वातावरण निर्माण गर्नु।" },
    { section: "hero-subtitle", title: "Community in motion", body: "युवा एकता, समाज सेवा र समृद्धिको अभियान" },
    { section: "donate-note", title: "Donate", body: "Support our community work." },
  ];
  const values = rows.map((r) => `(${s(uuid())}, ${s(r.section)}, ${s(r.title)}, ${s(r.body)}, now(), NULL)`).join(",");
  return `INSERT INTO club_content (id, section, title, body, updated_at, updated_by) VALUES ${values} ON CONFLICT (section) DO NOTHING`;
}

async function main() {
  await client.connect();
  console.log("Connected to database.");

  for (const ddl of TABLES) {
    await client.query(ddl);
  }

  // better-auth tables (created by better-auth at runtime too; create if missing for determinism)
  await client.query(`CREATE TABLE IF NOT EXISTS "user" (
    id text primary key, name text not null, email text not null unique,
    "emailVerified" boolean not null default false, image text,
    role text not null default 'viewer',
    "createdAt" timestamp not null default now(), "updatedAt" timestamp not null default now())`);
  await client.query(`CREATE TABLE IF NOT EXISTS "session" (
    id text primary key, "expiresAt" timestamp not null, token text not null unique,
    "createdAt" timestamp not null default now(), "updatedAt" timestamp not null default now(),
    "ipAddress" text, "userAgent" text, "userId" text not null)`);
  await client.query(`CREATE TABLE IF NOT EXISTS "account" (
    id text primary key, "accountId" text not null, "providerId" text not null, "userId" text not null,
    "accessToken" text, "refreshToken" text, "idToken" text,
    "accessTokenExpiresAt" timestamp, "refreshTokenExpiresAt" timestamp,
    scope text, password text, "createdAt" timestamp not null default now(), "updatedAt" timestamp not null default now())`);
  await client.query(`CREATE TABLE IF NOT EXISTS "verification" (
    id text primary key, identifier text not null, value text not null,
    "expiresAt" timestamp not null, "createdAt" timestamp default now(), "updatedAt" timestamp default now())`);

  const seeds = [
    ["club_members", seedMembers],
    ["committee_records", seedCommittee],
    ["club_works", seedWorks],
    ["club_programs", seedPrograms],
    ["club_donations", seedDonations],
    ["club_content", seedContent],
  ];
  for (const [table, fn] of seeds) {
    const count = (await client.query(`SELECT count(*)::int AS c FROM ${table}`)).rows[0].c;
    if (count === 0) {
      await client.query(fn());
      console.log(`Seeded ${table}`);
    } else {
      console.log(`Skipped ${table} (already has ${count} rows)`);
    }
  }

  const ps = (await client.query(`SELECT count(*)::int AS c FROM payment_settings`)).rows[0].c;
  if (ps === 0) {
    await client.query(`INSERT INTO payment_settings (id, bank_qr_url, esewa_qr_url, updated_at, updated_by) VALUES (${s(uuid())}, NULL, NULL, now(), NULL)`);
    console.log("Seeded payment_settings");
  }

  await client.end();
  console.log("Database init complete.");
}

main().catch((err) => {
  console.error("Init failed:", err);
  process.exit(1);
});
