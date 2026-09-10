import {execFileSync} from "node:child_process";

import {shouldApplyHostedMigrations} from "../src/lib/hosted-migrations";

if (shouldApplyHostedMigrations()) {
  execFileSync("pnpm", ["db:migrate"], {stdio: "inherit"});
  execFileSync("pnpm", ["db:seed"], {stdio: "inherit"});
}
