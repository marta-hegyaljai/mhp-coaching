import {afterAll, describe, expect, it} from "vitest";
import {eq} from "drizzle-orm";

import {closeDb, getDb} from "@/db";
import {courseCalls} from "@/db/schema";
import {getDatabaseUrl} from "@/lib/database-url";
import {zurichLocalToUtc} from "@/features/rooms/timezone";

import {scheduleCourseCall} from "./booking";
import {insertScheduledCall, replaceCallHours} from "./repository";

const hasDatabase = Boolean(getDatabaseUrl());

describe.skipIf(!hasDatabase)("course call reservations", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    if (createdIds.length > 0) {
      for (const id of createdIds) {
        await getDb().delete(courseCalls).where(eq(courseCalls.id, id));
      }
    }
    await replaceCallHours(
      [1, 2, 3, 4, 5].flatMap((weekday) => [
        {weekday, startMinute: 9 * 60, endMinute: 12 * 60},
        {weekday, startMinute: 14 * 60, endMinute: 17 * 60},
      ]),
    );
    await closeDb();
  });

  it("refuses a second booking of a slot that is already reserved", async () => {
    await replaceCallHours([{weekday: 1, startMinute: 9 * 60, endMinute: 12 * 60}]);
    const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const now = new Date("2026-09-01T08:00:00.000Z");
    const date = "2026-09-14";
    const time = "09:00";

    const first = await scheduleCourseCall({
      date,
      time,
      firstName: "Ada",
      lastName: "Lovelace",
      email: `ada-${stamp}@example.com`,
      phone: "+41 79 000 00 01",
      locale: "en",
      courseId: "omni-practitioner",
      courseTitle: "OMNI Hypnosis Practitioner",
      privacyAcceptedAt: now,
      now,
    });
    createdIds.push(first.id);

    await expect(
      scheduleCourseCall({
        date,
        time,
        firstName: "Grace",
        lastName: "Hopper",
        email: `grace-${stamp}@example.com`,
        phone: "+41 79 000 00 02",
        locale: "en",
        courseId: "omni-practitioner",
        courseTitle: "OMNI Hypnosis Practitioner",
        privacyAcceptedAt: now,
        now,
      }),
    ).rejects.toMatchObject({code: "slotUnavailable"});
  });

  it("rejects concurrent inserts of the same quarter-hour", async () => {
    const date = "2026-09-14";
    const start = zurichLocalToUtc(date, "10:00");
    const end = zurichLocalToUtc(date, "10:15");
    expect(start.ok && end.ok).toBe(true);
    if (!start.ok || !end.ok) {
      return;
    }

    const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const now = new Date("2026-09-01T08:00:00.000Z");
    const payload = {
      startsAt: start.instant,
      endsAt: end.instant,
      status: "SCHEDULED" as const,
      firstName: "Ada",
      lastName: "Lovelace",
      phone: "+41 79 000 00 01",
      locale: "en",
      courseId: "omni-practitioner",
      courseTitle: "OMNI Hypnosis Practitioner",
      message: null,
      privacyAcceptedAt: now,
    };

    const [first, second] = await Promise.all([
      insertScheduledCall({
        ...payload,
        email: `one-${stamp}@example.com`,
      }),
      insertScheduledCall({
        ...payload,
        firstName: "Grace",
        lastName: "Hopper",
        email: `two-${stamp}@example.com`,
      }),
    ]);

    const outcomes = [first, second];
    expect(outcomes.filter((item) => item.ok)).toHaveLength(1);
    expect(outcomes.filter((item) => !item.ok && item.reason === "overlap")).toHaveLength(1);
    for (const item of outcomes) {
      if (item.ok) {
        createdIds.push(item.call.id);
      }
    }
  });
});
