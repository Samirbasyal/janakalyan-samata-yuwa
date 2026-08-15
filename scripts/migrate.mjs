// One-off migration for columns/tables added after the initial init-db run.
import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envFile = path.join(root, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
});
await client.connect();
const statements = [
  `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS thread_key text NOT NULL DEFAULT 'group'`,
  `ALTER TABLE admin_notes ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'admin'`,
  `CREATE TABLE IF NOT EXISTS bank_accounts (
    id text primary key, name text not null, account_holder text, account_number text,
    qr_url text, is_active boolean not null default true,
    created_at timestamp not null default now(), updated_at timestamp not null default now())`,
  `CREATE TABLE IF NOT EXISTS club_notifications (
    id text primary key, type text not null, title text not null, body text not null,
    entity_type text, entity_id text, recipient_role text not null default 'admin',
    is_read boolean not null default false, created_at timestamp not null default now())`,
  `CREATE TABLE IF NOT EXISTS chat_reads (
    user_id text not null, thread_key text not null,
    last_read_at timestamp not null default now(), PRIMARY KEY (user_id, thread_key))`,
  `CREATE TABLE IF NOT EXISTS club_records (
    id text primary key, type text not null, title text not null, amount integer not null default 0,
    category text, record_date timestamp not null default now(), notes text,
    created_by text not null, created_at timestamp not null default now(),
    updated_at timestamp not null default now())`,
];
for (const sql of statements) {
  await client.query(sql);
  console.log("ok:", sql.slice(0, 60));
}
await client.end();
console.log("Migration complete.");
