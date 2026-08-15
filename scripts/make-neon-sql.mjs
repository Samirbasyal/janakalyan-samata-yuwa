// Generates neon-setup.sql from the init-db DDL (paste into Neon SQL Editor).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const src = fs.readFileSync(path.join(root, "scripts", "init-db.mjs"), "utf8");
const match = src.match(/const TABLES = \[([\s\S]*?)\n\];/);
if (!match) {
  console.error("TABLES array not found");
  process.exit(1);
}
// Extract each backtick-quoted DDL string (multi-line aware)
const ddl = [];
let current = null;
for (const line of match[1].split("\n")) {
  if (current === null) {
    const start = line.indexOf("`");
    if (start !== -1) current = line.slice(start + 1);
  } else {
    const end = line.lastIndexOf("`");
    if (end !== -1) {
      current += "\n" + line.slice(0, end);
      ddl.push(current.trim());
      current = null;
    } else {
      current += "\n" + line;
    }
  }
}

const header = [
  "-- Janakalyan Samata Yuwa Club - Neon database setup",
  "-- 1) Paste this into Neon SQL Editor and click Run.",
  "-- 2) Deploy पछि /sign-up बाट account बनाउनुहोस्, अनि तलको UPDATE चलाउनुहोस् (admin बनाउन)।",
  "",
  "-- better-auth tables",
  `CREATE TABLE IF NOT EXISTS "user" (id text primary key, name text not null, email text not null unique, "emailVerified" boolean not null default false, image text, role text not null default 'viewer', "createdAt" timestamp not null default now(), "updatedAt" timestamp not null default now());`,
  `CREATE TABLE IF NOT EXISTS "session" (id text primary key, "expiresAt" timestamp not null, token text not null unique, "createdAt" timestamp not null default now(), "updatedAt" timestamp not null default now(), "ipAddress" text, "userAgent" text, "userId" text not null);`,
  `CREATE TABLE IF NOT EXISTS "account" (id text primary key, "accountId" text not null, "providerId" text not null, "userId" text not null, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamp, "refreshTokenExpiresAt" timestamp, scope text, password text, "createdAt" timestamp not null default now(), "updatedAt" timestamp not null default now());`,
  `CREATE TABLE IF NOT EXISTS "verification" (id text primary key, identifier text not null, value text not null, "expiresAt" timestamp not null, "createdAt" timestamp default now(), "updatedAt" timestamp default now());`,
  "",
  ...ddl.map((t) => `${t};`),
  "",
  "-- FIRST ADMIN (deploy पछि यो चलाउनुहोस्):",
  "-- 1) Site मा /sign-up बाट account बनाउनुहोस्",
  "-- 2) यो UPDATE चलाउनुहोस्:",
  `-- UPDATE "user" SET role = 'admin', "emailVerified" = true WHERE email = 'basyalsamir099@gmail.com';`,
  "",
  "-- OPTIONAL: seed members/committee/works (site भरिएको देखाउन) — scripts/init-db.mjs को seed section बाट INSERT statements",
].join("\n\n");

fs.writeFileSync(path.join(root, "neon-setup.sql"), header);
console.log(`neon-setup.sql written (${ddl.length} club tables + auth tables)`);
