import {describe, expect, it} from "vitest";

import {
  completeDragSelection,
  resolveDragSelection,
  slotsFromColumn,
  type DragSlot,
} from "./drag-select";

function slot(
  start: string,
  end: string,
  extra?: Partial<DragSlot>,
): DragSlot {
  return {
    columnKey: "room-a",
    date: "2026-09-14",
    start,
    end,
    roomIds: ["room-1"],
    available: true,
    ...extra,
  };
}

const morning: DragSlot[] = [
  slot("09:00", "09:30"),
  slot("09:30", "10:00"),
  slot("10:00", "10:30"),
  slot("10:30", "11:00"),
];

describe("resolveDragSelection", () => {
  it("accepts a contiguous available range that meets the minimum", () => {
    const result = resolveDragSelection({
      slots: morning,
      columnKey: "room-a",
      fromIndex: 0,
      toIndex: 1,
      intervalMinutes: 30,
      minimumBookingMinutes: 60,
      maximumBookingMinutes: null,
    });

    expect(result).toEqual({
      ok: true,
      selection: {
        columnKey: "room-a",
        date: "2026-09-14",
        start: "09:00",
        end: "10:00",
        roomIds: ["room-1"],
        durationMinutes: 60,
      },
    });
  });

  it("rejects a booked gap and a range that is too long", () => {
    const withGap = [...morning];
    withGap[1] = slot("09:30", "10:00", {available: false});

    expect(
      resolveDragSelection({
        slots: withGap,
        columnKey: "room-a",
        fromIndex: 0,
        toIndex: 2,
        intervalMinutes: 30,
        minimumBookingMinutes: 60,
        maximumBookingMinutes: null,
      }).ok,
    ).toBe(false);

    expect(
      resolveDragSelection({
        slots: morning,
        columnKey: "room-a",
        fromIndex: 0,
        toIndex: 3,
        intervalMinutes: 30,
        minimumBookingMinutes: 60,
        maximumBookingMinutes: 60,
      }),
    ).toEqual({ok: false, reason: "too-long"});
  });

  it("keeps rooms that stay free for the whole range", () => {
    const overlapping: DragSlot[] = [
      slot("09:00", "09:30", {roomIds: ["a", "b"]}),
      slot("09:30", "10:00", {roomIds: ["b"]}),
    ];

    expect(
      resolveDragSelection({
        slots: overlapping,
        columnKey: "room-a",
        fromIndex: 0,
        toIndex: 1,
        intervalMinutes: 30,
        minimumBookingMinutes: 60,
        maximumBookingMinutes: null,
      }),
    ).toMatchObject({
      ok: true,
      selection: {roomIds: ["b"]},
    });
  });
});

describe("completeDragSelection", () => {
  it("extends a short click forward to the minimum duration", () => {
    const result = completeDragSelection({
      slots: morning,
      columnKey: "room-a",
      fromIndex: 0,
      toIndex: 0,
      intervalMinutes: 30,
      minimumBookingMinutes: 60,
      maximumBookingMinutes: null,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.selection.start).toBe("09:00");
      expect(result.selection.end).toBe("10:00");
    }
  });
});

describe("slotsFromColumn", () => {
  it("marks only selectable cells as available", () => {
    expect(
      slotsFromColumn({
        columnKey: "col",
        cells: [
          {startTime: "09:00", endTime: "09:30", select: {date: "2026-09-14", roomIds: ["r"]}},
          {startTime: "09:30", endTime: "10:00"},
        ],
      }),
    ).toEqual([
      {
        columnKey: "col",
        date: "2026-09-14",
        start: "09:00",
        end: "09:30",
        roomIds: ["r"],
        available: true,
      },
      {
        columnKey: "col",
        date: "",
        start: "09:30",
        end: "10:00",
        roomIds: [],
        available: false,
      },
    ]);
  });
});
