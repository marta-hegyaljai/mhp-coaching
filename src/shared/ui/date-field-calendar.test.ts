import {describe, expect, it} from "vitest";

import {
  isIsoDate,
  isIsoInRange,
  monthWeeks,
  parseIsoDate,
  shiftMonth,
  toIsoDate,
} from "./date-field-calendar";

describe("date field calendar", () => {
  it("rejects impossible calendar days", () => {
    expect(isIsoDate("2026-09-13")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(parseIsoDate("2026-09-13")).toEqual({year: 2026, month: 8, day: 13});
    expect(parseIsoDate("13.09.2026")).toBeNull();
  });

  it("builds a Monday-first grid with empty leading cells", () => {
    // 1 September 2026 is a Tuesday.
    const weeks = monthWeeks(2026, 8);

    expect(weeks[0]).toEqual([
      null,
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
      "2026-09-06",
    ]);
    expect(weeks[weeks.length - 1]?.[6]).toBeNull();
    expect(toIsoDate(2026, 8, 30)).toBe("2026-09-30");
  });

  it("shifts months across a year boundary", () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({year: 2025, month: 11});
    expect(shiftMonth(2026, 11, 1)).toEqual({year: 2027, month: 0});
  });

  it("keeps min and max inclusive", () => {
    expect(isIsoInRange("2026-09-13", "2026-09-13", "2026-09-20")).toBe(true);
    expect(isIsoInRange("2026-09-12", "2026-09-13")).toBe(false);
    expect(isIsoInRange("2026-09-21", undefined, "2026-09-20")).toBe(false);
  });
});
