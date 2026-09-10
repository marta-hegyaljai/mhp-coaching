import {describe, expect, it} from "vitest";

import {isUpcomingRegistration, lastOccupiedDay} from "./course-timing";
import {todayIsoInZurich} from "@/features/courses/dates";

describe("course registration timing", () => {
  it("uses the last occupied day, including a single-day session", () => {
    expect(lastOccupiedDay("2026-09-10", "2026-09-20")).toBe("2026-09-20");
    expect(lastOccupiedDay("2026-09-10", null)).toBe("2026-09-10");
    expect(lastOccupiedDay("2026-09-10", "2026-09-10")).toBe("2026-09-10");
  });

  it("treats a course as upcoming through the Zurich date of its last occupied day", () => {
    expect(isUpcomingRegistration("2026-03-29", "2026-03-30", "2026-03-30")).toBe(true);
    expect(isUpcomingRegistration("2026-03-29", "2026-03-30", "2026-03-31")).toBe(false);
    expect(isUpcomingRegistration("2026-03-30", null, "2026-03-30")).toBe(true);
    expect(isUpcomingRegistration("2026-03-29", null, "2026-03-30")).toBe(false);
  });

  it("classifies at the Zurich calendar day, not UTC midnight", () => {
    const zurichNextDay = new Date("2026-03-29T22:30:00.000Z");
    expect(todayIsoInZurich(zurichNextDay)).toBe("2026-03-30");
    expect(
      isUpcomingRegistration("2026-03-29", "2026-03-29", todayIsoInZurich(zurichNextDay)),
    ).toBe(false);
    expect(
      isUpcomingRegistration("2026-03-30", "2026-03-30", todayIsoInZurich(zurichNextDay)),
    ).toBe(true);
  });
});
