#!/usr/bin/env tsx
/**
 * Convenience wrapper around scripts/migrate-prod-time-entries.sql.
 *
 * Reads the SQL file, runs it inside a single transaction against
 * $DATABASE_URL, and streams NOTICE messages to the console.
 *
 * Usage:
 *   DATABASE_URL=postgres://... tsx scripts/migrate-prod-time-entries.ts
 *   DATABASE_URL=postgres://... tsx scripts/migrate-prod-time-entries.ts --dry-run
 *
 * --dry-run wraps the script in BEGIN/ROLLBACK so nothing is committed.
 *
 * Always pg_dump the production DB before running for real.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg, { type Notice } from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = resolve(__dirname, "migrate-prod-time-entries.sql");

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set.");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");
const sql = readFileSync(sqlPath, "utf8");

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  client.on("notice", (msg: Notice) => {
    console.log(`[db] ${msg.message ?? String(msg)}`);
  });

  await client.connect();
  console.log(
    `Connected. Running migration ${dryRun ? "(DRY RUN — will rollback)" : "(LIVE)"}...`,
  );

  try {
    // The .sql file already wraps everything in BEGIN/COMMIT. For a dry run
    // we strip the trailing COMMIT and append ROLLBACK instead.
    let toRun = sql;
    if (dryRun) {
      toRun = sql.replace(/\bCOMMIT\s*;\s*$/m, "ROLLBACK;");
    }
    await client.query(toRun);
    console.log(
      dryRun
        ? "Dry run complete. All changes were rolled back."
        : "Migration complete. Production is now on the normalized schema.",
    );
  } catch (err) {
    console.error("Migration FAILED — rolling back transaction.");
    console.error(err);
    try {
      await client.query("ROLLBACK");
    } catch (rbErr) {
      // If the server already rolled back (e.g. it aborted the txn on error),
      // this will just say "no transaction in progress" — safe to ignore.
      console.error("(ROLLBACK best-effort failed; likely already rolled back.)");
    }
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
