import pg from "pg";
const client = new pg.Client({ connectionString: "postgres://postgres:postgres@localhost:5432/postgres" });
await client.connect();
const members = await client.query("select id, name, email, status from club_members order by joined_at desc limit 8");
console.log("latest members:", JSON.stringify(members.rows, null, 1));
const count = await client.query("select count(*)::int as c from club_members");
console.log("total members:", count.rows[0].c);
await client.end();
