import {describe, expect, it} from "vitest";

import {isListedActivityKind, listedActivityTotal} from "./listed";
import type {ActivityKindCounts} from "./types";

const counts = {
  registration: 10,
  reservation: 6,
  call: 3,
  message: 2,
  waitlist: 2,
  change: 208,
} satisfies ActivityKindCounts;

describe("isListedActivityKind", () => {
  it("keeps the audit log out of the default board", () => {
    expect(isListedActivityKind("all", "registration")).toBe(true);
    expect(isListedActivityKind("all", "change")).toBe(false);
  });

  it("honours an explicit channel, including the log", () => {
    expect(isListedActivityKind("waitlist", "waitlist")).toBe(true);
    expect(isListedActivityKind("waitlist", "call")).toBe(false);
    expect(isListedActivityKind("change", "change")).toBe(true);
  });
});

describe("listedActivityTotal", () => {
  it("counts the live day, not the log, when nothing is filtered", () => {
    expect(listedActivityTotal(counts, "all")).toBe(23);
  });

  it("counts only the chosen channel", () => {
    expect(listedActivityTotal(counts, "waitlist")).toBe(2);
    expect(listedActivityTotal(counts, "change")).toBe(208);
  });
});
