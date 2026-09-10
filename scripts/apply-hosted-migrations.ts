import {execFileSync} from "node:child_process";

import {getDatabaseUrl} from "../src/lib/database-url";
import {
  shouldApplyHostedMigrations,
  shouldSeedHostedCatalogue,
} from "../src/lib/hosted-migrations";

if (shouldApplyHostedMigrations() && getDatabaseUrl()) {
  execFileSync("pnpm", ["db:migrate"], {stdio: "inherit"});
  if (shouldSeedHostedCatalogue()) {
    execFileSync("pnpm", ["db:seed"], {stdio: "inherit"});
  }
}
