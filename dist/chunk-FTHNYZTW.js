import {
  schema_exports
} from "./chunk-ZQT7LNUZ.js";

// server/db.ts
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 1e4,
  connectionTimeoutMillis: 5e3
});
var db = drizzle({ client: pool, schema: schema_exports });

export {
  pool,
  db
};
