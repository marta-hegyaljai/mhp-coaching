import {afterAll, describe, expect, it} from "vitest";
import {eq} from "drizzle-orm";

import {closeDb, getDb} from "@/db";
import {waitlistEntries} from "@/db/schema";
import {getDatabaseUrl} from "@/lib/database-url";
import {createWaitlistEntry} from "./repository";

const hasDatabase = Boolean(getDatabaseUrl());

function entry(email: string, courseSessionId: string | null) {
  return {
    courseId: "omni-practitioner",
    courseTitle: "OMNI Hypnosis Practitioner",
    firstName: "Ada",
    lastName: "Lovelace",
    email,
    phone: "",
    locale: "en",
    privacyAcceptedAt: new Date(),
    courseSessionId,
  };
}

describe.skipIf(!hasDatabase)("waitlist uniqueness", () => {
  afterAll(async () => {
    await closeDb();
  });

  it("allows the same email on a session list and a course-level list", async () => {
    const email = `waitlist-unique-${Date.now()}@example.test`;
    const sessionId = "omni-practitioner-2026-10-08";

    const courseLevel = await createWaitlistEntry(entry(email, null));
    const sessionLevel = await createWaitlistEntry(entry(email, sessionId));
    const duplicateCourse = await createWaitlistEntry(entry(email, null));
    const duplicateSession = await createWaitlistEntry(entry(email, sessionId));

    expect(courseLevel).not.toBe("duplicate");
    expect(sessionLevel).not.toBe("duplicate");
    expect(duplicateCourse).toBe("duplicate");
    expect(duplicateSession).toBe("duplicate");

    const db = getDb();
    if (courseLevel !== "duplicate") {
      await db.delete(waitlistEntries).where(eq(waitlistEntries.id, courseLevel.id));
    }
    if (sessionLevel !== "duplicate") {
      await db.delete(waitlistEntries).where(eq(waitlistEntries.id, sessionLevel.id));
    }
  });
});
