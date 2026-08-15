-- Janakalyan Samata Yuwa Club - Neon database setup

-- 1) Paste this into Neon SQL Editor and click Run.

-- 2) Deploy पछि /sign-up बाट account बनाउनुहोस्, अनि तलको UPDATE चलाउनुहोस् (admin बनाउन)।



-- better-auth tables

CREATE TABLE IF NOT EXISTS "user" (id text primary key, name text not null, email text not null unique, "emailVerified" boolean not null default false, image text, role text not null default 'viewer', "createdAt" timestamp not null default now(), "updatedAt" timestamp not null default now());

CREATE TABLE IF NOT EXISTS "session" (id text primary key, "expiresAt" timestamp not null, token text not null unique, "createdAt" timestamp not null default now(), "updatedAt" timestamp not null default now(), "ipAddress" text, "userAgent" text, "userId" text not null);

CREATE TABLE IF NOT EXISTS "account" (id text primary key, "accountId" text not null, "providerId" text not null, "userId" text not null, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamp, "refreshTokenExpiresAt" timestamp, scope text, password text, "createdAt" timestamp not null default now(), "updatedAt" timestamp not null default now());

CREATE TABLE IF NOT EXISTS "verification" (id text primary key, identifier text not null, value text not null, "expiresAt" timestamp not null, "createdAt" timestamp default now(), "updatedAt" timestamp default now());



CREATE TABLE IF NOT EXISTS club_members (
    id text primary key,
    name text not null,
    role text not null,
    ward text,
    phone text,
    email text,
    status text not null default 'active',
    joined_at timestamp not null default now(),
    updated_at timestamp not null default now()
  );

CREATE TABLE IF NOT EXISTS club_content (
    id text primary key,
    section text not null unique,
    title text not null,
    body text not null,
    updated_at timestamp not null default now(),
    updated_by text
  );

CREATE TABLE IF NOT EXISTS club_donations (
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
  );

CREATE TABLE IF NOT EXISTS club_expenses (
    id text primary key,
    title text not null,
    amount integer not null,
    purpose text not null,
    receipt_url text,
    spent_at timestamp not null default now(),
    created_by text not null
  );

CREATE TABLE IF NOT EXISTS club_applications (
    id text primary key,
    name text not null,
    phone text not null,
    email text,
    message text,
    status text not null default 'pending',
    created_at timestamp not null default now()
  );

CREATE TABLE IF NOT EXISTS club_works (
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
  );

CREATE TABLE IF NOT EXISTS club_programs (
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
  );

CREATE TABLE IF NOT EXISTS club_gallery (
    id text primary key,
    title text not null,
    description text,
    category text not null,
    image_url text not null,
    taken_at timestamp,
    created_by text not null
  );

CREATE TABLE IF NOT EXISTS club_announcements (
    id text primary key,
    title text not null,
    body text not null,
    category text not null,
    published boolean not null default true,
    created_at timestamp not null default now(),
    created_by text not null
  );

CREATE TABLE IF NOT EXISTS club_audit_logs (
    id text primary key,
    action text not null,
    entity text not null,
    entity_id text,
    admin_id text not null,
    created_at timestamp not null default now()
  );

CREATE TABLE IF NOT EXISTS club_contact_messages (
    id text primary key,
    name text not null,
    email text not null,
    phone text,
    message text not null,
    status text not null default 'new',
    created_at timestamp not null default now()
  );

CREATE TABLE IF NOT EXISTS club_membership_profiles (
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
  );

CREATE TABLE IF NOT EXISTS admin_notes (
    id text primary key,
    title text not null,
    content text not null,
    visibility text not null default 'admin',
    created_by text not null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
  );

CREATE TABLE IF NOT EXISTS loans (
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
  );

CREATE TABLE IF NOT EXISTS loan_returns (
    id text primary key,
    loan_id text not null,
    amount integer not null,
    return_date timestamp not null default now(),
    notes text,
    created_by text not null
  );

CREATE TABLE IF NOT EXISTS monthly_member_contributions (
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
  );

CREATE TABLE IF NOT EXISTS committee_records (
    id text primary key,
    member_name text not null,
    position text not null,
    responsibilities text,
    work_details text,
    work_count integer not null default 0,
    achievements text,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
  );

CREATE TABLE IF NOT EXISTS member_workspace_items (
    id text primary key,
    member_id text not null,
    item_type text not null,
    title text not null,
    details text,
    event_date timestamp,
    is_public boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
  );

CREATE TABLE IF NOT EXISTS payment_settings (
    id text primary key,
    bank_qr_url text,
    esewa_qr_url text,
    updated_at timestamp not null default now(),
    updated_by text
  );

CREATE TABLE IF NOT EXISTS club_records (
    id text primary key, type text not null, title text not null, amount integer not null default 0,
    category text, record_date timestamp not null default now(), notes text,
    created_by text not null, created_at timestamp not null default now(),
    updated_at timestamp not null default now()
  );

CREATE TABLE IF NOT EXISTS content_visibility (
    id text primary key,
    entity_type text not null,
    record_id text not null,
    visibility text not null default 'public',
    updated_by text,
    updated_at timestamp not null default now()
  );

CREATE TABLE IF NOT EXISTS bank_accounts (
    id text primary key,
    name text not null,
    account_holder text,
    account_number text,
    qr_url text,
    is_active boolean not null default true,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
  );

CREATE TABLE IF NOT EXISTS club_notifications (
    id text primary key,
    type text not null,
    title text not null,
    body text not null,
    entity_type text,
    entity_id text,
    recipient_role text not null default 'admin',
    is_read boolean not null default false,
    created_at timestamp not null default now()
  );

CREATE TABLE IF NOT EXISTS chat_messages (
    id text primary key,
    sender_id text not null,
    sender_name text not null,
    channel text not null default 'group',
    thread_key text not null default 'group',
    recipient_id text,
    message text not null,
    created_at timestamp not null default now()
  );

CREATE TABLE IF NOT EXISTS chat_reads (
    user_id text not null,
    thread_key text not null,
    last_read_at timestamp not null default now(),
    PRIMARY KEY (user_id, thread_key)
  );



-- FIRST ADMIN (deploy पछि यो चलाउनुहोस्):

-- 1) Site मा /sign-up बाट account बनाउनुहोस्

-- 2) यो UPDATE चलाउनुहोस्:

-- UPDATE "user" SET role = 'admin', "emailVerified" = true WHERE email = 'basyalsamir099@gmail.com';



-- OPTIONAL: seed members/committee/works (site भरिएको देखाउन) — scripts/init-db.mjs को seed section बाट INSERT statements