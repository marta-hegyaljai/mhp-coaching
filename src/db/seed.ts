import {config} from "dotenv";

import {closeDb} from "@/db";
import {upsertSeedCatalogue} from "@/features/courses/repository";

config({path: ".env.local"});
config();

async function seed() {
  await upsertSeedCatalogue();
  console.log("Seeded the course catalogue into PostgreSQL.");
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
