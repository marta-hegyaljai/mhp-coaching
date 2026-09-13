import {describe, expect, it} from "vitest";

import {
  dateInWeek,
  firstOfMonth,
  pickerMonth,
  shiftPickerMonth,
  weekContaining,
} from "./period-range";

describe("period range", () => {
  it("resolves the Monday–Sunday week for a midweek date", () => {
    expect(weekContaining("2026-09-16")).toEqual({
      startDate: "2026-09-14",
      endDate: "2026-09-20",
    });
    expect(dateInWeek("2026-09-14", "2026-09-16")).toBe(true);
    expect(dateInWeek("2026-09-21", "2026-09-16")).toBe(false);
  });

  it("shifts the picker month across year boundaries", () => {
    expect(firstOfMonth(2026, 9)).toBe("2026-09-01");
    expect(pickerMonth("2026-09-13")).toEqual({year: 2026, month: 9});
    expect(shiftPickerMonth({year: 2026, month: 1}, -1)).toEqual({year: 2025, month: 12});
  });
});
