import {afterAll, describe, expect, it} from "vitest";
import {eq} from "drizzle-orm";

import {closeDb, getDb} from "@/db";
import {courses} from "@/db/schema";
import {getDatabaseUrl} from "@/lib/database-url";
import {courses as seedCourses} from "@/features/courses/catalog";
import {
  listCatalogueFromDatabase,
  upsertSeedCatalogue,
} from "@/features/courses/repository";
import {isCoursePublished} from "@/features/courses/types";

const hasDatabase = Boolean(getDatabaseUrl());

describe.skipIf(!hasDatabase)("course catalogue persistence", () => {
  afterAll(async () => {
    await closeDb();
  });

  it("stores every hardcoded course and session without dropping ids", async () => {
    await upsertSeedCatalogue();
    const stored = await listCatalogueFromDatabase();

    expect(stored).toHaveLength(seedCourses.length);
    expect(stored.map((course) => course.id)).toEqual(seedCourses.map((course) => course.id));

    for (const seed of seedCourses) {
      const row = stored.find((course) => course.id === seed.id);
      expect(row).toBeDefined();
      expect(row?.title).toEqual(seed.title);
      expect(row?.priceChf).toBe(seed.priceChf);
      expect(row?.published).toBe(isCoursePublished(seed));
      expect(row?.dates.map((date) => date.id)).toEqual(seed.dates.map((date) => date.id));
      expect(row?.dates.map((date) => date.startDate)).toEqual(
        seed.dates.map((date) => date.startDate),
      );
    }

    const paused = stored.find((course) => course.id === "transgenerational-mia");
    expect(paused?.published).toBe(false);
    const practitioner = stored.find((course) => course.id === "omni-practitioner");
    expect(practitioner?.dates).toHaveLength(3);
  });

  it("does not overwrite an unpublished course on reseed", async () => {
    await upsertSeedCatalogue();
    const db = getDb();
    await db
      .update(courses)
      .set({published: false, updatedAt: new Date()})
      .where(eq(courses.id, "omni-practitioner"));

    await upsertSeedCatalogue();
    const stored = await listCatalogueFromDatabase();
    expect(stored.find((course) => course.id === "omni-practitioner")?.published).toBe(false);

    await db
      .update(courses)
      .set({published: true, updatedAt: new Date()})
      .where(eq(courses.id, "omni-practitioner"));
  });
});
