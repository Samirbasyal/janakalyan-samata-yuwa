// Set a user's password using better-auth's own hashing.
// Usage: node scripts/set-password.mjs <email> <new-password>
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

const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];
if (!email || !password) {
  console.error("Usage: node scripts/set-password.mjs <email> <new-password>");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
});
await client.connect();
const users = await client.query(`SELECT id, email, "emailVerified", role FROM "user" WHERE lower(email) = $1`, [email]);
if (users.rowCount === 0) {
  console.error(`No user found with email ${email}.`);
  process.exit(1);
}
const user = users.rows[0];
const hashed = await hashPassword(password);
const result = await client.query(
  `UPDATE "account" SET password = $1 WHERE "userId" = $2 AND "providerId" = 'credential' RETURNING id`,
  [hashed, user.id],
);
if (result.rowCount === 0) {
  // No credential account row yet — create one
  await client.query(
    `INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") VALUES ($1, $2, 'credential', $2, $3, now(), now())`,
    [crypto.randomUUID(), user.id, hashed],
  );
  console.log(`Password set (new credential row) for ${user.email}.`);
} else {
  console.log(`Password updated for ${user.email} (role=${user.role}, emailVerified=${user.emailVerified}).`);
}
await client.end();
