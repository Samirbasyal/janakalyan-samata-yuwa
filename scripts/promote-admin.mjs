// Promote a user to admin (or another staff role).
// Usage: node scripts/promote-admin.mjs you@example.com [role]
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
const role = (process.argv[3] || "admin").trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/promote-admin.mjs <email> [role]");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
});
await client.connect();
const result = await client.query(`UPDATE "user" SET role = $1 WHERE lower(email) = $2 RETURNING id, name, email, role`, [role, email]);
if (result.rowCount === 0) {
  console.error(`No user found with email ${email}. Sign up first, then run this again.`);
  process.exit(1);
}
console.log(`Promoted ${result.rows[0].email} to role "${result.rows[0].role}".`);
await client.end();
