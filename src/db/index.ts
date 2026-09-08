import {drizzle, type NodePgDatabase} from "drizzle-orm/node-postgres";
import {Pool} from "pg";

import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

let pool: Pool | undefined;
let database: Database | undefined;

export function getDb(): Database {
  if (database) {
    return database;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  pool = new Pool({connectionString: databaseUrl});
  database = drizzle({client: pool, schema});
  return database;
}

export async function closeDb(): Promise<void> {
  await pool?.end();
  pool = undefined;
  database = undefined;
}
