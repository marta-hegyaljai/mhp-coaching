import {drizzle, type NodePgDatabase} from "drizzle-orm/node-postgres";
import {Pool} from "pg";

import {getDatabaseUrl} from "@/lib/database-url";

import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

let pool: Pool | undefined;
let database: Database | undefined;

export function getDb(): Database {
  if (database) {
    return database;
  }

  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  pool = new Pool({
    connectionString: databaseUrl,
    max: process.env.VERCEL ? 1 : 10,
  });
  database = drizzle({client: pool, schema});
  return database;
}

export async function closeDb(): Promise<void> {
  await pool?.end();
  pool = undefined;
  database = undefined;
}
