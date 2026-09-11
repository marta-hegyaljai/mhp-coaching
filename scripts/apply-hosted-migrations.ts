import {execFileSync} from "node:child_process";

import {getMigrationDatabaseUrl} from "../src/lib/database-url";
import {
  shouldApplyHostedMigrations,
  shouldSeedHostedCatalogue,
} from "../src/lib/hosted-migrations";

if (shouldApplyHostedMigrations() && getMigrationDatabaseUrl()) {
  execFileSync("pnpm", ["db:migrate"], {stdio: "inherit"});
  if (shouldSeedHostedCatalogue()) {
    execFileSync("pnpm", ["db:seed"], {stdio: "inherit"});
  }
}
