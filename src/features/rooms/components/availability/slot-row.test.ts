import {describe, expect, it} from "vitest";

import {isHourStart, slotTrackRows} from "./slot-row";

describe("slotTrackRows", () => {
  it("splits a bar into one equal track per interval", () => {
    expect(slotTrackRows(1)).toBe("repeat(1, 1fr)");
    expect(slotTrackRows(4)).toBe("repeat(4, 1fr)");
  });

  it("always keeps at least one usable track", () => {
    expect(slotTrackRows(0)).toBe("repeat(1, 1fr)");
    expect(slotTrackRows(-3)).toBe("repeat(1, 1fr)");
    expect(slotTrackRows(2.6)).toBe("repeat(2, 1fr)");
    expect(slotTrackRows(Number.NaN)).toBe("repeat(1, 1fr)");
  });
});

describe("isHourStart", () => {
  it("marks only full hours", () => {
    expect(isHourStart("08:00")).toBe(true);
    expect(isHourStart("08:30")).toBe(false);
    expect(isHourStart(undefined)).toBe(false);
    expect(isHourStart("")).toBe(false);
  });
});
