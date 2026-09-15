import {afterEach, describe, expect, it, vi} from "vitest";

import {dateOfBirthBounds, isValidDateOfBirth} from "./date-of-birth";

describe("date of birth bounds", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("requires a real past date within 120 years", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T10:00:00.000Z"));

    expect(dateOfBirthBounds("2026-09-15")).toEqual({
      min: "1906-09-15",
      max: "2026-09-14",
    });
    expect(isValidDateOfBirth("1990-05-15", "2026-09-15")).toBe(true);
    expect(isValidDateOfBirth("2026-09-15", "2026-09-15")).toBe(false);
    expect(isValidDateOfBirth("2026-09-16", "2026-09-15")).toBe(false);
    expect(isValidDateOfBirth("1906-09-14", "2026-09-15")).toBe(false);
    expect(isValidDateOfBirth("not-a-date", "2026-09-15")).toBe(false);
  });

  it("keeps 29 February inside a valid leap-year birthday", () => {
    expect(isValidDateOfBirth("2000-02-29", "2026-09-15")).toBe(true);
    expect(isValidDateOfBirth("2001-02-29", "2026-09-15")).toBe(false);
  });
});
