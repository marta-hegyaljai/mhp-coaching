import {describe, expect, it} from "vitest";

import type {CourseDate} from "@/features/courses/types";

import {
  buildSessionEntries,
  countSessionEntries,
  dayCountOf,
  filterSessionGroups,
  occupancyRatio,
  sessionCanBeDeleted,
  summarizeSessions,
} from "./model";

const location = {fr: "Fribourg", de: "Freiburg", en: "Fribourg"};

function session(overrides: Partial<CourseDate> & {id: string; startDate: string}): CourseDate {
  return {
    location,
    capacity: 16,
    active: true,
    ...overrides,
  };
}

describe("buildSessionEntries", () => {
  const today = "2026-06-15";

  it("puts what is ahead first, nearest date on top", () => {
    const groups = buildSessionEntries(
      [
        session({id: "c", startDate: "2026-11-02"}),
        session({id: "a", startDate: "2026-07-01"}),
        session({id: "b", startDate: "2026-09-10"}),
      ],
      {},
      today,
    );

    expect(groups.upcoming.map((entry) => entry.date.id)).toEqual(["a", "b", "c"]);
    expect(groups.past).toHaveLength(0);
  });

  it("archives finished sessions with the most recent first", () => {
    const groups = buildSessionEntries(
      [
        session({id: "old", startDate: "2025-01-10"}),
        session({id: "recent", startDate: "2026-05-04"}),
      ],
      {},
      today,
    );

    expect(groups.upcoming).toHaveLength(0);
    expect(groups.past.map((entry) => entry.date.id)).toEqual(["recent", "old"]);
  });

  it("keeps a session running today out of the archive", () => {
    const groups = buildSessionEntries(
      [session({id: "running", startDate: "2026-06-12", endDate: today})],
      {},
      today,
    );

    expect(groups.upcoming.map((entry) => entry.date.id)).toEqual(["running"]);
  });

  it("orders equal start dates by id so the list never shuffles", () => {
    const groups = buildSessionEntries(
      [
        session({id: "b", startDate: "2026-07-01"}),
        session({id: "a", startDate: "2026-07-01"}),
      ],
      {},
      today,
    );

    expect(groups.upcoming.map((entry) => entry.date.id)).toEqual(["a", "b"]);
  });

  it("never reports negative seats, even when a session is oversold", () => {
    const [entry] = buildSessionEntries(
      [session({id: "full", startDate: "2026-07-01", capacity: 8})],
      {full: 11},
      today,
    ).upcoming;

    expect(entry.enrolments).toBe(11);
    expect(entry.seatsLeft).toBe(0);
  });

  it("normalises missing and broken counts to zero", () => {
    const [entry] = buildSessionEntries(
      [session({id: "odd", startDate: "2026-07-01", capacity: Number.NaN})],
      {other: 3},
      today,
    ).upcoming;

    expect(entry.capacity).toBe(0);
    expect(entry.enrolments).toBe(0);
    expect(entry.seatsLeft).toBe(0);
  });
});

describe("dayCountOf", () => {
  it("counts both ends of a range", () => {
    expect(dayCountOf(session({id: "a", startDate: "2026-03-12", endDate: "2026-03-14"}))).toBe(3);
  });

  it("counts a single day when the end is missing or equal", () => {
    expect(dayCountOf(session({id: "a", startDate: "2026-03-12"}))).toBe(1);
    expect(dayCountOf(session({id: "a", startDate: "2026-03-12", endDate: "2026-03-12"}))).toBe(1);
  });

  it("spans month and year boundaries", () => {
    expect(dayCountOf(session({id: "a", startDate: "2026-12-30", endDate: "2027-01-02"}))).toBe(4);
  });

  it("falls back to one day for reversed or unparseable ranges", () => {
    expect(dayCountOf(session({id: "a", startDate: "2026-03-14", endDate: "2026-03-12"}))).toBe(1);
    expect(dayCountOf(session({id: "a", startDate: "not-a-date"}))).toBe(1);
  });
});

describe("summarizeSessions", () => {
  it("counts only bookable future sessions as upcoming", () => {
    const groups = buildSessionEntries(
      [
        session({id: "next", startDate: "2026-07-01"}),
        session({id: "paused", startDate: "2026-08-01", active: false}),
        session({id: "done", startDate: "2026-01-05"}),
      ],
      {next: 4, done: 12},
      "2026-06-15",
    );

    expect(summarizeSessions(groups)).toEqual({
      total: 3,
      upcoming: 1,
      past: 1,
      inactive: 1,
      enrolments: 16,
    });
  });
});

describe("filterSessionGroups", () => {
  const groups = buildSessionEntries(
    [
      session({id: "next", startDate: "2026-07-01"}),
      session({id: "paused", startDate: "2026-08-01", active: false}),
      session({id: "done", startDate: "2026-01-05"}),
      session({id: "old-off", startDate: "2026-01-02", active: false}),
    ],
    {},
    "2026-06-15",
  );

  it("keeps only bookable future sessions", () => {
    const visible = filterSessionGroups(groups, "upcoming");
    expect(visible.upcoming.map((entry) => entry.date.id)).toEqual(["next"]);
    expect(visible.past).toHaveLength(0);
  });

  it("keeps inactive dates from both groups", () => {
    const visible = filterSessionGroups(groups, "inactive");
    expect(visible.upcoming.map((entry) => entry.date.id)).toEqual(["paused"]);
    expect(visible.past.map((entry) => entry.date.id)).toEqual(["old-off"]);
  });

  it("archives finished sessions only", () => {
    const visible = filterSessionGroups(groups, "past");
    expect(visible.upcoming).toHaveLength(0);
    expect(countSessionEntries(visible)).toBe(2);
  });
});

describe("occupancyRatio", () => {
  it("clamps oversold sessions to a full bar", () => {
    expect(occupancyRatio(4, 16)).toBe(0.25);
    expect(occupancyRatio(20, 16)).toBe(1);
    expect(occupancyRatio(3, 0)).toBe(1);
    expect(occupancyRatio(0, 0)).toBe(0);
  });
});

describe("sessionCanBeDeleted", () => {
  it("allows delete only when nobody has enrolled", () => {
    expect(sessionCanBeDeleted({enrolments: 0})).toBe(true);
    expect(sessionCanBeDeleted({enrolments: 1})).toBe(false);
  });
});
