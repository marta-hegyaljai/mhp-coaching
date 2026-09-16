import {afterAll, describe, expect, it} from "vitest";
import {eq} from "drizzle-orm";

import {closeDb, getDb} from "@/db";
import {bookings, courses} from "@/db/schema";
import {getDatabaseUrl} from "@/lib/database-url";
import {createPendingBooking} from "@/features/bookings/repository";
import {courses as seedCourses} from "@/features/courses/catalog";
import {DEFAULT_CATALOGUE_ORDER} from "@/features/courses/catalogue-order";
import {
  applyDefaultCatalogueDisplayOrders,
  createCourseSession,
  deleteCourseSession,
  listCatalogueFromDatabase,
  setProgrammeModules,
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
    await applyDefaultCatalogueDisplayOrders();
    const stored = await listCatalogueFromDatabase();

    expect(stored).toHaveLength(seedCourses.length);
    expect(stored.map((course) => course.id).sort()).toEqual(
      seedCourses.map((course) => course.id).sort(),
    );
    expect(stored[0]?.id).toBe(DEFAULT_CATALOGUE_ORDER[0]);
    expect(stored.findIndex((course) => course.id === "anxiety-hypnosis")).toBeLessThan(
      stored.findIndex((course) => course.id === "advanced-techniques"),
    );

    for (const seed of seedCourses) {
      const row = stored.find((course) => course.id === seed.id);
      expect(row).toBeDefined();
      expect(row?.title).toEqual(seed.title);
      expect(row?.priceChf).toBe(seed.priceChf);
      expect(row?.published).toBe(isCoursePublished(seed));
      const storedIds = row?.dates.map((date) => date.id) ?? [];
      const storedStarts = row?.dates.map((date) => date.startDate) ?? [];
      expect(storedIds).toEqual(expect.arrayContaining(seed.dates.map((date) => date.id)));
      expect(storedStarts).toEqual(
        expect.arrayContaining(seed.dates.map((date) => date.startDate)),
      );
    }

    const paused = stored.find((course) => course.id === "transgenerational-mia");
    expect(paused?.published).toBe(false);
    const practitioner = stored.find((course) => course.id === "omni-practitioner");
    expect(practitioner?.dates.map((date) => date.id)).toEqual(
      expect.arrayContaining([
        "omni-practitioner-2026-09-10",
        "omni-practitioner-2026-10-08",
        "omni-practitioner-2026-11-12",
      ]),
    );
  });

  it("round-trips the programme format and its ordered modules", async () => {
    await upsertSeedCatalogue();
    const stored = await listCatalogueFromDatabase();
    const programme = stored.find((course) => course.id === "master-practitioner");
    const seed = seedCourses.find((course) => course.id === "master-practitioner");

    expect(programme?.format).toBe("programme");
    expect(programme?.moduleIds).toEqual(seed?.moduleIds);
    expect(stored.at(-1)?.id).toBe("master-practitioner");

    const single = stored.find((course) => course.id === "anxiety-hypnosis");
    expect(single?.format).toBe("module");
    expect(single?.moduleIds).toBeUndefined();
  });

  it("replaces programme contents without leaving stale links", async () => {
    await upsertSeedCatalogue();
    await setProgrammeModules("master-practitioner", ["anxiety-hypnosis"]);
    const trimmed = await listCatalogueFromDatabase();
    expect(
      trimmed.find((course) => course.id === "master-practitioner")?.moduleIds,
    ).toEqual(["anxiety-hypnosis"]);

    const seed = seedCourses.find((course) => course.id === "master-practitioner");
    await setProgrammeModules("master-practitioner", seed?.moduleIds ?? []);
    const restored = await listCatalogueFromDatabase();
    expect(
      restored.find((course) => course.id === "master-practitioner")?.moduleIds,
    ).toEqual(seed?.moduleIds);
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

  it("deletes a session only when nobody has enrolled", async () => {
    const location = {
      fr: "Fribourg",
      de: "Freiburg",
      en: "Fribourg",
    };
    const emptyId = `delete-empty-${Date.now()}`;
    const enrolledId = `delete-enrolled-${Date.now()}`;

    await createCourseSession({
      id: emptyId,
      courseId: "omni-practitioner",
      startDate: "2030-01-06",
      endDate: null,
      location,
      venue: null,
      capacity: 16,
      active: false,
    });
    await createCourseSession({
      id: enrolledId,
      courseId: "omni-practitioner",
      startDate: "2030-01-13",
      endDate: null,
      location,
      venue: null,
      capacity: 16,
      active: false,
    });

    const booking = await createPendingBooking({
      firstName: "Ada",
      lastName: "Guest",
      dateOfBirth: "1975-12-10",
      email: `session-delete-${Date.now()}@example.test`,
      phone: "+41 79 000 00 00",
      street: "Chemin de la Fenetta 42",
      postalCode: "1752",
      city: "Villars-sur-Glâne",
      country: "CH",
      locale: "en",
      courseId: "omni-practitioner",
      courseDateId: enrolledId,
      courseTitle: "OMNI Hypnosis Practitioner",
      courseDateStart: "2030-01-13",
      location: "Fribourg",
      amountMinor: 349000,
      currency: "chf",
      paymentProvider: "fake",
      privacyAcceptedAt: new Date(),
      status: "PAID",
    });

    expect(await deleteCourseSession({id: emptyId, courseId: "stripe-payment-test"})).toBe(
      "missing",
    );
    expect(await deleteCourseSession({id: emptyId, courseId: "omni-practitioner"})).toBe(
      "deleted",
    );
    expect(await deleteCourseSession({id: enrolledId, courseId: "omni-practitioner"})).toBe(
      "hasEnrolments",
    );

    const course = (await listCatalogueFromDatabase()).find(
      (item) => item.id === "omni-practitioner",
    );
    expect(course?.dates.map((date) => date.id)).not.toContain(emptyId);
    expect(course?.dates.map((date) => date.id)).toContain(enrolledId);

    const db = getDb();
    await db.delete(bookings).where(eq(bookings.id, booking.id));
    expect(await deleteCourseSession({id: enrolledId, courseId: "omni-practitioner"})).toBe(
      "deleted",
    );
  });
});
