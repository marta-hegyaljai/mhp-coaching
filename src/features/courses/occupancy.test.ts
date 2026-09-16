import {describe, expect, it} from "vitest";

import type {CourseDate} from "./types";
import {
  courseScheduleStatus,
  datesWithOpenSeats,
  isSessionFull,
  nearestFullDate,
  publicCourseAction,
  publicDateBookingQuery,
  publicSeatHint,
  seatsLeft,
  seatsLeftForDate,
  sessionOffer,
} from "./occupancy";

const location = {fr: "Fribourg", de: "Freiburg", en: "Fribourg"};

function date(
  overrides: Partial<CourseDate> & Pick<CourseDate, "id" | "startDate">,
): CourseDate {
  return {
    location,
    capacity: 16,
    active: true,
    ...overrides,
  };
}

describe("public occupancy", () => {
  it("hides remaining seats when three or more are left", () => {
    expect(seatsLeft(16, 0)).toBe(16);
    expect(publicSeatHint(16)).toBe("plenty");
    expect(publicSeatHint(3)).toBe("plenty");
  });

  it("surfaces only the last one or two seats", () => {
    expect(publicSeatHint(2)).toBe(2);
    expect(publicSeatHint(1)).toBe(1);
  });

  it("treats a filled session as full, including broken zero capacity", () => {
    expect(seatsLeft(16, 16)).toBe(0);
    expect(seatsLeft(16, 20)).toBe(0);
    expect(publicSeatHint(0)).toBe("full");
    expect(isSessionFull(date({id: "a", startDate: "2026-10-01", capacity: 0}), {})).toBe(
      true,
    );
  });

  it("keeps a course open when any published date still has a seat", () => {
    const dates = [
      date({id: "full", startDate: "2026-10-01", capacity: 2}),
      date({id: "open", startDate: "2026-11-01", capacity: 8}),
    ];
    const occupancy = {full: 2, open: 1};

    expect(courseScheduleStatus(dates, occupancy)).toBe("open");
    expect(datesWithOpenSeats(dates, occupancy).map((item) => item.id)).toEqual(["open"]);
    expect(seatsLeftForDate(dates[0], occupancy)).toBe(0);
  });

  it("is full only when every published date is taken, and pending with no dates", () => {
    const dates = [
      date({id: "a", startDate: "2026-10-01", capacity: 2}),
      date({id: "b", startDate: "2026-09-01", capacity: 4}),
    ];

    expect(courseScheduleStatus(dates, {a: 2, b: 4})).toBe("full");
    expect(nearestFullDate(dates, {a: 2, b: 4})?.id).toBe("b");
    expect(courseScheduleStatus([], {})).toBe("pending");
  });

  it("maps schedule status onto the public course CTA", () => {
    expect(publicCourseAction("open")).toBe("book");
    expect(publicCourseAction("full")).toBe("waitlist");
    expect(publicCourseAction("pending")).toBe("notify");
    expect(publicCourseAction("closed")).toBe("closed");
  });

  it("lets staff override the public offer without a developer", () => {
    const dates = [
      date({id: "open", startDate: "2026-10-01", capacity: 8}),
      date({id: "later", startDate: "2026-11-01", capacity: 8}),
    ];

    expect(courseScheduleStatus(dates, {}, "full")).toBe("full");
    expect(publicCourseAction(courseScheduleStatus(dates, {}, "full"))).toBe("waitlist");
    expect(courseScheduleStatus(dates, {}, "dates_pending")).toBe("pending");
    expect(publicCourseAction(courseScheduleStatus(dates, {}, "dates_pending"))).toBe(
      "notify",
    );
    expect(courseScheduleStatus(dates, {}, "registration_closed")).toBe("closed");
    expect(sessionOffer(dates[0], {}, "registration_closed")).toBe("closed");
    expect(publicDateBookingQuery("closed", "open")).toBeNull();
  });

  it("keeps occupancy as a safety net when staff mark a course available", () => {
    const dates = [date({id: "a", startDate: "2026-10-01", capacity: 2})];

    expect(courseScheduleStatus(dates, {a: 2}, "available")).toBe("full");
    expect(sessionOffer(dates[0], {a: 2}, "available")).toBe("full");
    expect(courseScheduleStatus(dates, {a: 0}, "available")).toBe("open");
  });

  it("honours a per-session closed or full mark without hiding other dates", () => {
    const dates = [
      date({
        id: "closed",
        startDate: "2026-10-01",
        availability: "registration_closed",
      }),
      date({id: "full", startDate: "2026-11-01", availability: "full", capacity: 8}),
      date({id: "open", startDate: "2026-12-01", capacity: 8}),
    ];

    expect(sessionOffer(dates[0], {})).toBe("closed");
    expect(sessionOffer(dates[1], {})).toBe("full");
    expect(sessionOffer(dates[2], {})).toBe("open");
    expect(courseScheduleStatus(dates, {})).toBe("open");
    expect(datesWithOpenSeats(dates, {}).map((item) => item.id)).toEqual(["open"]);
    expect(publicDateBookingQuery("full", "full")).toEqual({
      date: "full",
      waitlist: "1",
    });
  });

  it("is closed when every remaining date is marked closed", () => {
    const dates = [
      date({
        id: "a",
        startDate: "2026-10-01",
        availability: "registration_closed",
      }),
      date({
        id: "b",
        startDate: "2026-11-01",
        availability: "registration_closed",
      }),
    ];

    expect(courseScheduleStatus(dates, {})).toBe("closed");
    expect(publicCourseAction("closed")).toBe("closed");
  });
});
