import {describe, expect, it} from "vitest";

import {zurichLocalToUtc} from "@/features/rooms/timezone";

import {datesWithSlots, findSlot, slotsForDate, type CallWindow} from "./availability";
import type {CallHourInterval} from "./hours";

const mondayHours: CallHourInterval[] = [
  {weekday: 1, startMinute: 9 * 60, endMinute: 10 * 60},
];

function windowOn(date: string, earliestIso: string): CallWindow {
  return {
    minDate: date,
    maxDate: date,
    earliestStart: new Date(earliestIso),
  };
}

describe("call slot generation", () => {
  it("offers 15-minute starts inside an open window", () => {
    const date = "2026-09-14";
    const window = windowOn(date, "2026-09-01T00:00:00.000Z");
    const slots = slotsForDate(date, mondayHours, [], window);

    expect(slots.map((slot) => slot.time)).toEqual(["09:00", "09:15", "09:30", "09:45"]);
  });

  it("hides a slot that is already booked", () => {
    const date = "2026-09-14";
    const window = windowOn(date, "2026-09-01T00:00:00.000Z");
    const takenStart = zurichLocalToUtc(date, "09:15");
    const takenEnd = zurichLocalToUtc(date, "09:30");
    expect(takenStart.ok && takenEnd.ok).toBe(true);
    if (!takenStart.ok || !takenEnd.ok) {
      return;
    }

    const slots = slotsForDate(
      date,
      mondayHours,
      [{date, time: "09:15", startsAt: takenStart.instant, endsAt: takenEnd.instant}],
      window,
    );

    expect(slots.map((slot) => slot.time)).toEqual(["09:00", "09:30", "09:45"]);
    expect(findSlot(date, "09:15", mondayHours, [
      {date, time: "09:15", startsAt: takenStart.instant, endsAt: takenEnd.instant},
    ], window)).toBeUndefined();
  });

  it("does not offer a slot that starts before the notice window", () => {
    const date = "2026-09-14";
    const tooLate = zurichLocalToUtc(date, "09:10");
    expect(tooLate.ok).toBe(true);
    if (!tooLate.ok) {
      return;
    }
    const slots = slotsForDate(date, mondayHours, [], {
      minDate: date,
      maxDate: date,
      earliestStart: tooLate.instant,
    });

    expect(slots.map((slot) => slot.time)).toEqual(["09:15", "09:30", "09:45"]);
  });

  it("lists only days that still have a free slot", () => {
    const dates = datesWithSlots(
      mondayHours,
      [],
      {
        minDate: "2026-09-14",
        maxDate: "2026-09-16",
        earliestStart: new Date("2026-09-01T00:00:00.000Z"),
      },
    );

    expect(dates).toEqual(["2026-09-14"]);
  });
});
