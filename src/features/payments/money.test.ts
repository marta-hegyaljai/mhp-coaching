import {describe, expect, it} from "vitest";

import {formatChf, francsToMinorUnits, minorUnitsToFrancs} from "./money";

describe("payment money helpers", () => {
  it("converts Swiss francs to minor units without floating error", () => {
    expect(francsToMinorUnits(3490)).toBe(349000);
    expect(francsToMinorUnits(3490.5)).toBe(349050);
    expect(minorUnitsToFrancs(349050)).toBe(3490.5);
    expect(formatChf(3490, "fr")).toContain("CHF");
    expect(formatChf(3490, "de", {compact: true})).toContain("3’490");
  });

  it("keeps decimals by default and drops them only for whole compact amounts", () => {
    expect(formatChf(3490, "fr")).toMatch(/\.00/);
    expect(formatChf(3490, "fr", {compact: true})).not.toMatch(/\.00/);
    expect(formatChf(3490.5, "fr", {compact: true})).toMatch(/50/);
  });
});
