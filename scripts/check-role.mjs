import pg from "pg";
const client = new pg.Client({ connectionString: "postgres://postgres:postgres@localhost:5432/postgres" });
await client.connect();
const r = await client.query(`SELECT email, role FROM "user" WHERE email = $1`, ["sectest@example.com"]);
console.log("USER:", JSON.stringify(r.rows[0] ?? null));
await client.end();
