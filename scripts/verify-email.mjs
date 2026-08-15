// Dev helper: mark a user's email as verified (better-auth user table).
// Usage: node scripts/verify-email.mjs user@example.com
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

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/verify-email.mjs <email>");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
});
await client.connect();
const result = await client.query(
  `UPDATE "user" SET "emailVerified" = true WHERE lower(email) = $1 RETURNING id, name, email, "emailVerified"`,
  [email],
);
if (result.rowCount === 0) {
  console.error(`No user found with email ${email}.`);
  process.exit(1);
}
console.log(`Email verified for ${result.rows[0].email}.`);
await client.end();
