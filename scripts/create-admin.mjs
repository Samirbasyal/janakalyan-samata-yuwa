// Create (or reset) the main admin account: email verified + role admin.
// Usage: node scripts/create-admin.mjs <email> <password> [name]
import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashPassword } from "better-auth/crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envFile = path.join(root, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const email = (process.argv[2] || "").trim().toLowerCase();
const password = process.argv[3] || "";
const name = process.argv[4] || "Admin";
if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password> [name]");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
});
await client.connect();

const hashed = await hashPassword(password);
const existing = await client.query(`SELECT id FROM "user" WHERE lower(email) = $1`, [email]);
let userId;
if (existing.rowCount > 0) {
  userId = existing.rows[0].id;
  await client.query(
    `UPDATE "user" SET name = $1, role = 'admin', "emailVerified" = true, "updatedAt" = now() WHERE id = $2`,
    [name, userId],
  );
  await client.query(
    `UPDATE "account" SET password = $1 WHERE "userId" = $2 AND "providerId" = 'credential'`,
    [hashed, userId],
  );
  console.log(`Admin ${email} updated (verified + role admin + new password).`);
} else {
  userId = crypto.randomUUID();
  await client.query(
    `INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt") VALUES ($1, $2, $3, true, 'admin', now(), now())`,
    [userId, name, email],
  );
  await client.query(
    `INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") VALUES ($1, $2, 'credential', $2, $3, now(), now())`,
    [crypto.randomUUID(), userId, hashed],
  );
  console.log(`Admin ${email} created (verified + role admin).`);
}
await client.end();
