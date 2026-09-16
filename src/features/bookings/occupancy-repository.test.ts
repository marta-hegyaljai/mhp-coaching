import {afterAll, describe, expect, it} from "vitest";
import {eq} from "drizzle-orm";

import {closeDb, getDb} from "@/db";
import {bookings} from "@/db/schema";
import {getDatabaseUrl} from "@/lib/database-url";
import {
  countOccupyingEnrolmentsByDate,
  createOccupyingBooking,
  createPendingBooking,
} from "@/features/bookings/repository";
import {createCourseSession, deleteCourseSession} from "@/features/courses/repository";

const hasDatabase = Boolean(getDatabaseUrl());

const location = {fr: "Fribourg", de: "Freiburg", en: "Fribourg"};

function bookingInput(courseDateId: string, email: string) {
  return {
    firstName: "Ada",
    lastName: "Guest",
    dateOfBirth: "1975-12-10",
    email,
    phone: "+41 79 000 00 00",
    street: "Chemin de la Fenetta 42",
    postalCode: "1752",
    city: "Villars-sur-Glâne",
    country: "CH",
    locale: "en" as const,
    courseId: "omni-practitioner",
    courseDateId,
    courseTitle: "OMNI Hypnosis Practitioner",
    courseDateStart: "2031-03-02",
    location: "Fribourg",
    amountMinor: 349000,
    currency: "chf",
    paymentProvider: "fake",
    privacyAcceptedAt: new Date(),
  };
}

describe.skipIf(!hasDatabase)("session occupancy", () => {
  afterAll(async () => {
    await closeDb();
  });

  it("blocks a second occupying checkout when the session is full", async () => {
    const sessionId = `occupancy-full-${Date.now()}`;
    await createCourseSession({
      id: sessionId,
      courseId: "omni-practitioner",
      startDate: "2031-03-02",
      endDate: null,
      location,
      venue: null,
      capacity: 1,
      active: true,
    });

    const first = await createOccupyingBooking(
      bookingInput(sessionId, `full-one-${Date.now()}@example.test`),
      1,
    );
    expect(first).not.toBe("full");
    if (first === "full") {
      return;
    }

    const second = await createOccupyingBooking(
      bookingInput(sessionId, `full-two-${Date.now()}@example.test`),
      1,
    );
    expect(second).toBe("full");

    const occupancy = await countOccupyingEnrolmentsByDate([sessionId]);
    expect(occupancy[sessionId]).toBe(1);

    const lead = await createPendingBooking({
      ...bookingInput(sessionId, `full-lead-${Date.now()}@example.test`),
      status: "LEAD",
    });
    const occupancyWithLead = await countOccupyingEnrolmentsByDate([sessionId]);
    expect(occupancyWithLead[sessionId]).toBe(1);

    const db = getDb();
    await db.delete(bookings).where(eq(bookings.id, first.id));
    await db.delete(bookings).where(eq(bookings.id, lead.id));
    await deleteCourseSession({id: sessionId, courseId: "omni-practitioner"});
  });
});
