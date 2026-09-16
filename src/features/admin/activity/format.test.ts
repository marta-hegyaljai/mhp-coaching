import {describe, expect, it} from "vitest";

import {arrivalWhen, excerpt} from "./format";
import {activityBounds} from "./window";

describe("arrivalWhen", () => {
  it("reads an instant as Zurich wall-clock, not UTC", () => {
    // 22:30 UTC in summer is already the next day in Zurich.
    expect(arrivalWhen(new Date("2026-07-15T22:30:00.000Z"), "en")).toEqual({
      dateLabel: "16 July 2026",
      timeLabel: "00:30",
    });
  });

  it("localizes the date", () => {
    expect(arrivalWhen(new Date("2026-01-15T09:00:00.000Z"), "fr").dateLabel).toBe(
      "15 janvier 2026",
    );
  });
});

describe("excerpt", () => {
  it("collapses newlines and runs of whitespace", () => {
    expect(excerpt("Bonjour,\n\n  j'ai   une question.")).toBe(
      "Bonjour, j'ai une question.",
    );
  });

  it("keeps a short message intact", () => {
    expect(excerpt("Short")).toBe("Short");
  });

  it("truncates a long message to the limit", () => {
    const result = excerpt("a".repeat(400));

    expect(result).toHaveLength(140);
    expect(result.endsWith("…")).toBe(true);
  });

  it("survives an empty or whitespace-only message", () => {
    expect(excerpt("   \n  ")).toBe("");
  });
});

describe("activityBounds", () => {
  it("bounds the Zurich day the panel is showing, not the UTC day", () => {
    const bounds = activityBounds("today", new Date("2026-09-16T23:30:00.000Z"));

    // 23:30 UTC on 16 September is 01:30 on 17 September in Zurich.
    expect(bounds.today).toBe("2026-09-17");
    expect(bounds.dayStart.toISOString()).toBe("2026-09-16T22:00:00.000Z");
    expect(bounds.dayEndExclusive.toISOString()).toBe("2026-09-17T22:00:00.000Z");
  });
});
