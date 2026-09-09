import {describe, expect, it} from "vitest";

import {formatDateRange, formatDateParts, eachIsoDateInRange} from "./dates";

describe("formatDateRange", () => {
  it("collapses a range inside one month", () => {
    expect(formatDateRange("2026-10-08", "2026-10-18", "fr")).toBe(
      "8 – 18 octobre 2026",
    );
  });

  it("keeps both months when the range crosses one", () => {
    expect(formatDateRange("2026-10-28", "2026-11-03", "en")).toBe(
      "28 October 2026 – 3 November 2026",
    );
  });

  it("renders a single day when there is no end date", () => {
    expect(formatDateRange("2026-10-08", null, "de")).toBe("8. Oktober 2026");
    expect(formatDateRange("2026-10-08", "2026-10-08", "de")).toBe(
      "8. Oktober 2026",
    );
  });

  it("keeps full dates when the end precedes the start", () => {
    expect(formatDateRange("2026-10-18", "2026-10-08", "fr")).toBe(
      "18 octobre 2026 – 8 octobre 2026",
    );
  });
});

describe("formatDateParts", () => {
  it("aligns a one-digit start day with a two-digit neighbour", () => {
    expect(formatDateParts("2026-09-10", "2026-09-20", "fr")).toEqual({
      days: "10 – 20",
      month: "septembre",
      year: "2026",
      label: "10 – 20 septembre 2026",
    });
    expect(formatDateParts("2026-10-08", "2026-10-18", "fr")).toEqual({
      days: "\u20078 – 18",
      month: "octobre",
      year: "2026",
      label: "8 – 18 octobre 2026",
    });
  });

  it("keeps both months when a range crosses one", () => {
    expect(formatDateParts("2026-10-30", "2026-11-01", "fr")).toEqual({
      days: "30 – \u20071",
      month: "octobre – novembre",
      year: "2026",
      label: "30 octobre 2026 – 1 novembre 2026",
    });
  });
});

describe("eachIsoDateInRange", () => {
  it("lists every calendar day in a course range", () => {
    expect(eachIsoDateInRange("2026-10-30", "2026-11-01")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
    expect(eachIsoDateInRange("2026-12-05")).toEqual(["2026-12-05"]);
  });
});
