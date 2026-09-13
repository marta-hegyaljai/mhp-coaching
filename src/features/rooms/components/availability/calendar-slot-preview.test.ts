import {describe, expect, it} from "vitest";

import {
  buildCalendarSlotOptions,
  roomIdsForRange,
} from "./calendar-slot-preview";
import type {DragSlot} from "./drag-select";

function slot(
  start: string,
  end: string,
  extra?: Partial<DragSlot>,
): DragSlot {
  return {
    columnKey: "day",
    date: "2026-09-18",
    start,
    end,
    roomIds: ["room-a", "room-b"],
    available: true,
    ...extra,
  };
}

const morning: DragSlot[] = [
  slot("08:00", "08:30"),
  slot("08:30", "09:00"),
  slot("09:00", "09:30", {roomIds: ["room-a"]}),
  slot("09:30", "10:00", {roomIds: ["room-a"]}),
];

describe("buildCalendarSlotOptions", () => {
  it("lists valid starts and ends for a room", () => {
    const options = buildCalendarSlotOptions({
      slots: morning,
      roomId: "room-a",
      intervalMinutes: 30,
      minimumBookingMinutes: 60,
      maximumBookingMinutes: 120,
      hourlyRateMinor: 4500,
      discountPercent: 10,
    });

    expect(options.starts).toEqual(["08:00", "08:30", "09:00"]);
    expect(options.endsByStart["08:00"]?.map((item) => item.time)).toEqual([
      "09:00",
      "09:30",
      "10:00",
    ]);
    expect(options.endsByStart["09:00"]?.map((item) => item.time)).toEqual(["10:00"]);
  });

  it("respects the maximum duration", () => {
    const options = buildCalendarSlotOptions({
      slots: morning,
      roomId: "room-a",
      intervalMinutes: 30,
      minimumBookingMinutes: 60,
      maximumBookingMinutes: 60,
      hourlyRateMinor: 4500,
      discountPercent: 0,
    });

    expect(options.endsByStart["08:00"]?.map((item) => item.time)).toEqual(["09:00"]);
  });
});

describe("roomIdsForRange", () => {
  it("keeps rooms free across the whole interval", () => {
    expect(roomIdsForRange(morning, "08:00", "09:00")).toEqual(["room-a", "room-b"]);
    expect(roomIdsForRange(morning, "09:00", "10:00")).toEqual(["room-a"]);
  });

  it("rejects broken or unavailable ranges", () => {
    expect(roomIdsForRange(morning, "08:00", "10:00")).toEqual(["room-a"]);
    expect(roomIdsForRange(morning, "08:00", "09:15")).toEqual([]);

    const withGap = [...morning];
    withGap[1] = slot("08:30", "09:00", {available: false});
    expect(roomIdsForRange(withGap, "08:00", "09:00")).toEqual([]);
  });
});
