import {describe, expect, it} from "vitest";

import {
  addLocalDays,
  addZurichMonths,
  isoWeekday,
  isZurichMonthClosed,
  mondayOf,
  parseZurichMonthKey,
  previousZurichMonth,
  rangesOverlap,
  utcToZurich,
  zurichLocalToUtc,
  zurichMonthKey,
  zurichMonthOf,
  zurichMonthRange,
} from "@/features/rooms/timezone";

describe("Europe/Zurich local conversion", () => {
  it("converts a unique winter local time to UTC", () => {
    const result = zurichLocalToUtc("2026-01-15", "07:00");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.instant.toISOString()).toBe("2026-01-15T06:00:00.000Z");
      expect(utcToZurich(result.instant)).toMatchObject({
        date: "2026-01-15",
        time: "07:00",
        weekday: 4,
      });
    }
  });

  it("converts a unique summer local time to UTC", () => {
    const result = zurichLocalToUtc("2026-07-15", "21:00");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.instant.toISOString()).toBe("2026-07-15T19:00:00.000Z");
    }
  });

  it("rejects the spring-forward gap and the autumn overlap", () => {
    expect(zurichLocalToUtc("2026-03-29", "02:30")).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(zurichLocalToUtc("2026-10-25", "02:30")).toEqual({
      ok: false,
      reason: "ambiguous",
    });
    expect(zurichLocalToUtc("2026-03-29", "03:30").ok).toBe(true);
    expect(zurichLocalToUtc("2026-10-25", "01:30").ok).toBe(true);
    expect(zurichLocalToUtc("2026-10-25", "03:30").ok).toBe(true);
  });

  it("treats ranges as half-open at exact boundaries", () => {
    const start = new Date("2026-01-15T06:00:00.000Z");
    const mid = new Date("2026-01-15T11:00:00.000Z");
    const end = new Date("2026-01-15T12:00:00.000Z");
    expect(rangesOverlap(start, mid, mid, end)).toBe(false);
    expect(rangesOverlap(start, end, mid, end)).toBe(true);
  });

  it("finds Monday of a week and ISO weekdays", () => {
    expect(isoWeekday("2026-09-10")).toBe(4);
    expect(mondayOf("2026-09-10")).toBe("2026-09-07");
    expect(addLocalDays("2026-09-07", 6)).toBe("2026-09-13");
  });
});

describe("Zurich calendar months", () => {
  it("uses half-open Zurich midnight bounds, including DST months", () => {
    const september = zurichMonthRange({year: 2026, month: 9});
    expect(september.start.toISOString()).toBe("2026-08-31T22:00:00.000Z");
    expect(september.endExclusive.toISOString()).toBe("2026-09-30T22:00:00.000Z");
    expect(zurichMonthOf(september.start)).toEqual({year: 2026, month: 9});

    const lastSecond = new Date(september.endExclusive.getTime() - 1);
    expect(zurichMonthOf(lastSecond)).toEqual({year: 2026, month: 9});
    expect(zurichMonthOf(september.endExclusive)).toEqual({year: 2026, month: 10});

    const april = zurichMonthRange({year: 2026, month: 4});
    expect(april.start.toISOString()).toBe("2026-03-31T22:00:00.000Z");
    expect(zurichMonthOf(new Date("2026-03-31T21:59:59.000Z"))).toEqual({
      year: 2026,
      month: 3,
    });
  });

  it("parses month keys and walks closed months", () => {
    expect(zurichMonthKey({year: 2026, month: 8})).toBe("2026-08");
    expect(parseZurichMonthKey("2026-08")).toEqual({year: 2026, month: 8});
    expect(previousZurichMonth({year: 2026, month: 1})).toEqual({year: 2025, month: 12});
    expect(addZurichMonths({year: 2026, month: 11}, 2)).toEqual({year: 2027, month: 1});
    expect(isZurichMonthClosed({year: 2026, month: 8}, new Date("2026-09-14T06:00:00.000Z"))).toBe(
      true,
    );
    expect(isZurichMonthClosed({year: 2026, month: 9}, new Date("2026-09-14T06:00:00.000Z"))).toBe(
      false,
    );
  });
});
