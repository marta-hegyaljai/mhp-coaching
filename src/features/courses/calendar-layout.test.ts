import {describe, expect, it} from "vitest";

import type {CalendarSession} from "./calendar";
import {
  firstIsoInMonth,
  monthWeeks,
  occupiedMonthKeys,
  sessionBarLabel,
  sessionBarsForWeek,
} from "./calendar-layout";

function session(
  overrides: Partial<CalendarSession> &
    Pick<CalendarSession, "courseId" | "dateId" | "startDate">,
): CalendarSession {
  return {
    slug: "course",
    title: "Praticien·ne en Hypnose OMNI®",
    duration: "10 jours",
    priceLabel: "3’490 CHF",
    dateLabel: "range",
    location: "Fribourg",
    ...overrides,
  };
}

describe("monthWeeks", () => {
  it("starts November 2026 on Sunday after six empty cells", () => {
    const weeks = monthWeeks(2026, 10);
    expect(weeks[0]).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      "2026-11-01",
    ]);
    expect(weeks[2]?.[3]).toBe("2026-11-12");
  });
});

describe("sessionBarsForWeek", () => {
  const omni = session({
    courseId: "omni",
    dateId: "omni-nov",
    startDate: "2026-11-12",
    endDate: "2026-11-22",
  });

  it("draws one continuous bar across the occupied days of a week", () => {
    const week = monthWeeks(2026, 10)[2];
    const bars = sessionBarsForWeek(week, [omni]);

    expect(bars).toHaveLength(1);
    expect(bars[0]?.startCol).toBe(3);
    expect(bars[0]?.span).toBe(4);
    expect(bars[0]?.continuesBefore).toBe(false);
    expect(bars[0]?.continuesAfter).toBe(true);
    expect(bars[0]?.session.title).toContain("OMNI");
    expect(sessionBarLabel(bars[0]!)).toBe(
      "12–22 · Praticien·ne en Hypnose OMNI® →",
    );
  });

  it("continues the same course as a full-width bar the following week", () => {
    const week = monthWeeks(2026, 10)[3];
    const bars = sessionBarsForWeek(week, [omni]);

    expect(week[0]).toBe("2026-11-16");
    expect(bars[0]?.startCol).toBe(0);
    expect(bars[0]?.span).toBe(7);
    expect(bars[0]?.continuesBefore).toBe(true);
    expect(bars[0]?.continuesAfter).toBe(false);
    expect(sessionBarLabel(bars[0]!)).toBe(
      "← 12–22 · Praticien·ne en Hypnose OMNI®",
    );
  });

  it("lists every month a session occupies", () => {
    expect(
      occupiedMonthKeys({
        startDate: "2026-10-30",
        endDate: "2026-11-01",
      }),
    ).toEqual(["2026-10", "2026-11"]);
  });

  it("returns the first visible day of a session in a month", () => {
    expect(firstIsoInMonth(omni, 2026, 10)).toBe("2026-11-12");
    expect(firstIsoInMonth(omni, 2026, 9)).toBeNull();
    expect(
      firstIsoInMonth(
        session({
          courseId: "anxiety",
          dateId: "anxiety-1",
          startDate: "2026-10-30",
          endDate: "2026-11-01",
        }),
        2026,
        10,
      ),
    ).toBe("2026-11-01");
  });

  it("keeps overlapping courses on separate lanes", () => {
    const week: Array<string | null> = [
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ];
    const bars = sessionBarsForWeek(week, [
      session({
        courseId: "long",
        dateId: "long-1",
        startDate: "2026-10-05",
        endDate: "2026-10-11",
        title: "Long",
      }),
      session({
        courseId: "short",
        dateId: "short-1",
        startDate: "2026-10-08",
        endDate: "2026-10-09",
        title: "Short",
      }),
    ]);

    expect(bars).toHaveLength(2);
    expect(new Set(bars.map((bar) => bar.lane)).size).toBe(2);
  });
});
