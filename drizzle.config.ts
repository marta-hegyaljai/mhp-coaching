import {config} from "dotenv";
import {defineConfig} from "drizzle-kit";

import {getMigrationDatabaseUrl} from "./src/lib/database-url";

config({path: ".env.local"});
config();

const databaseUrl = getMigrationDatabaseUrl();

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Copy .env.example to .env.local first.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {url: databaseUrl},
  strict: true,
  verbose: true,
});
