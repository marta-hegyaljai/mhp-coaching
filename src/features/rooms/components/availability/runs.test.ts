import {describe, expect, it} from "vitest";

import {buildColumnCells, mergeSlotRuns} from "./runs";

describe("mergeSlotRuns", () => {
  it("keeps actionable available starts separate while collapsing status runs", () => {
    const runs = mergeSlotRuns([
      {startTime: "09:00", endTime: "09:30", state: "available", href: "/rooms"},
      {startTime: "09:30", endTime: "10:00", state: "available", href: "/rooms"},
      {startTime: "10:00", endTime: "10:30", state: "booked"},
      {startTime: "10:30", endTime: "11:00", state: "booked"},
    ]);

    expect(runs).toEqual([
      {
        startTime: "09:00",
        endTime: "09:30",
        state: "available",
        href: "/rooms",
        startIndex: 0,
        span: 1,
      },
      {
        startTime: "09:30",
        endTime: "10:00",
        state: "available",
        href: "/rooms",
        startIndex: 1,
        span: 1,
      },
      {startTime: "10:00", endTime: "11:00", state: "booked", startIndex: 2, span: 2},
    ]);
  });

  it("does not merge neighbouring own bookings that are different reservations", () => {
    const runs = mergeSlotRuns([
      {
        startTime: "10:00",
        endTime: "11:00",
        state: "my-booking",
        ownBookingId: "one",
      },
      {
        startTime: "11:00",
        endTime: "12:00",
        state: "my-booking",
        ownBookingId: "two",
      },
    ]);

    expect(runs).toHaveLength(2);
    expect(runs[0]?.ownBookingId).toBe("one");
    expect(runs[1]?.ownBookingId).toBe("two");
  });

  it("never bridges a gap in the time sequence", () => {
    const runs = mergeSlotRuns([
      {startTime: "09:00", endTime: "09:30", state: "available"},
      {startTime: "11:00", endTime: "11:30", state: "available"},
    ]);

    expect(runs).toHaveLength(2);
    expect(runs[1].startIndex).toBe(1);
  });

  it("returns nothing for an empty column", () => {
    expect(mergeSlotRuns([])).toEqual([]);
  });

  it("spans every row when the whole column shares one state", () => {
    const runs = mergeSlotRuns(
      buildColumnCells(["07:00", "07:30", "08:00"], 30, () => undefined),
    );

    expect(runs).toEqual([
      {startTime: "07:00", endTime: "08:30", state: "unavailable", startIndex: 0, span: 3},
    ]);
  });
});

describe("buildColumnCells", () => {
  it("keeps one cell per displayed time and fills missing slots", () => {
    const slots = new Map([
      ["07:00", {localStart: "07:00", localEnd: "07:30", state: "available" as const}],
    ]);
    const cells = buildColumnCells(["07:00", "07:30"], 30, (time) => slots.get(time));

    expect(cells).toEqual([
      {startTime: "07:00", endTime: "07:30", state: "available"},
      {startTime: "07:30", endTime: "08:00", state: "unavailable"},
    ]);
  });

  it("clamps the synthesized end at midnight and tolerates unusable times", () => {
    expect(buildColumnCells(["23:30"], 60, () => undefined)[0].endTime).toBe("24:00");
    expect(buildColumnCells(["oops"], 30, () => undefined)[0].endTime).toBe("oops");
    expect(buildColumnCells(["07:00"], 0, () => undefined)[0].endTime).toBe("07:01");
  });
});
