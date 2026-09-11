import {describe, expect, it} from "vitest";

import {
  formatDayHeading,
  formatDayRange,
  formatLongDate,
  formatWeekdayDate,
} from "./calendar-date";

describe("calendar date formatting", () => {
  it("renders the stored wall-clock day in each locale", () => {
    expect(formatLongDate("2026-03-20", "fr")).toBe("20 mars 2026");
    expect(formatLongDate("2026-03-20", "de")).toBe("20. März 2026");
    expect(formatLongDate("2026-03-20", "en")).toBe("20 March 2026");
  });

  it("keeps the day stable at a UTC midnight boundary", () => {
    expect(formatLongDate("2026-01-01", "en")).toBe("1 January 2026");
    expect(formatLongDate("2026-12-31", "en")).toBe("31 December 2026");
  });

  it("adds the weekday for a single day heading", () => {
    expect(formatWeekdayDate("2026-09-10", "en")).toBe("Thursday, 10 September 2026");
  });

  it("splits a compact column heading", () => {
    expect(formatDayHeading("2026-09-07", "en")).toEqual({weekday: "Mon", day: "7"});
  });

  it("collapses the shared parts of a range", () => {
    expect(formatDayRange("2026-09-07", "2026-09-13", "en")).toBe("7 – 13 September 2026");
    expect(formatDayRange("2026-09-28", "2026-10-04", "en")).toBe(
      "28 September – 4 October 2026",
    );
    expect(formatDayRange("2026-12-28", "2027-01-03", "en")).toBe(
      "28 December 2026 – 3 January 2027",
    );
    expect(formatDayRange("2026-09-07", "2026-09-07", "en")).toBe("7 September 2026");
  });

  it("falls back to the raw value instead of throwing on bad data", () => {
    expect(formatLongDate("not-a-date", "en")).toBe("not-a-date");
    expect(formatLongDate("2026-02-30", "en")).toBe("2026-02-30");
    expect(formatDayRange("2026-02-30", "2026-03-02", "en")).toBe("2026-02-30");
  });
});
