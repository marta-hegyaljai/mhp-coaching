import {describe, expect, it} from "vitest";

import type {BookableEnd, ReservationPreview} from "./reservations";
import {emptySlotDraft, resolveSlotSelection} from "./slot-selection";

function end(time: string, durationMinutes: number): BookableEnd {
  return {
    time,
    durationMinutes,
    quote: {
      baseHourlyRateMinor: 6000,
      discountPercent: 0,
      effectiveHourlyRateMinor: 6000,
      durationMinutes,
      amountMinor: (6000 * durationMinutes) / 60,
      currency: "CHF",
    },
  };
}

function preview(overrides: Partial<ReservationPreview> = {}): ReservationPreview {
  const endsByStart = {
    "08:00": [end("09:00", 60), end("10:00", 120)],
    "09:00": [end("10:00", 60)],
  };

  return {
    room: {id: "room-1", name: "Salle 1", hourlyRateMinor: 6000, currency: "CHF"},
    date: "2026-09-14",
    start: "08:00",
    end: "09:00",
    starts: ["08:00", "09:00"],
    ends: endsByStart["08:00"],
    endsByStart,
    quote: endsByStart["08:00"][0].quote,
    ...overrides,
  };
}

describe("resolveSlotSelection", () => {
  it("falls back to the server default while nothing is chosen", () => {
    const resolved = resolveSlotSelection(preview(), emptySlotDraft);

    expect(resolved).toMatchObject({start: "08:00", end: "09:00", ready: true});
  });

  it("honours a draft that still names a bookable slot", () => {
    const resolved = resolveSlotSelection(preview(), {start: "08:00", end: "10:00"});

    expect(resolved.end).toBe("10:00");
    expect(resolved.quote?.durationMinutes).toBe(120);
  });

  it("re-defaults the end when the chosen start no longer allows it", () => {
    const resolved = resolveSlotSelection(preview(), {start: "09:00", end: "17:00"});

    expect(resolved.start).toBe("09:00");
    expect(resolved.end).toBe("10:00");
    expect(resolved.ends).toHaveLength(1);
  });

  it("drops a draft start that the new day does not offer", () => {
    const nextDay = preview({
      start: "14:00",
      end: "15:00",
      starts: ["14:00"],
      ends: [end("15:00", 60)],
      endsByStart: {"14:00": [end("15:00", 60)]},
    });

    const resolved = resolveSlotSelection(nextDay, {start: "08:00", end: "09:00"});

    expect(resolved.start).toBe("14:00");
    expect(resolved.end).toBe("15:00");
  });

  it("is never ready without a preview", () => {
    expect(resolveSlotSelection(null, {start: "08:00", end: "09:00"})).toEqual({
      start: "",
      end: "",
      ends: [],
      quote: null,
      ready: false,
    });
  });

  it("is never ready when a start has no bookable end", () => {
    const blocked = preview({starts: ["08:00"], ends: [], endsByStart: {"08:00": []}});

    expect(resolveSlotSelection(blocked, emptySlotDraft).ready).toBe(false);
  });
});
