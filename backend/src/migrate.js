import "dotenv/config";
import { readFile } from "node:fs/promises";
import { pool } from "./db.js";

for (const file of ["schema.sql", "notes.sql", "calendar.sql"]) {
  const sql = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  await pool.query(sql);
  console.log(`Applied ${file}`);
}
await pool.end();
