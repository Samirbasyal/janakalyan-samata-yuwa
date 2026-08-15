import pg from "pg";
import { verifyPassword } from "better-auth/crypto";
const client = new pg.Client({ connectionString: "postgres://postgres:postgres@localhost:5432/postgres" });
await client.connect();
const email = process.argv[2] || "basyalsamir099@gmail.com";
const password = process.argv[3] || "samir@12";
const r = await client.query(
  `SELECT u.email, u.role, u."emailVerified", a.password FROM "user" u LEFT JOIN "account" a ON a."userId" = u.id AND a."providerId"='credential' WHERE lower(u.email) = $1`,
  [email.toLowerCase()],
);
if (r.rowCount === 0) {
  console.log("NO USER");
  process.exit(1);
}
const row = r.rows[0];
const ok = row.password ? await verifyPassword({ hash: row.password, password }) : false;
console.log(
  `email=${row.email} role=${row.role} verified=${row.emailVerified} passwordOK=${ok}`,
);
await client.end();
