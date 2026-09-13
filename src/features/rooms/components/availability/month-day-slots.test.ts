import {describe, expect, it} from "vitest";

import {dragSlotsForDay, firstBookableRange} from "./month-day-slots";

describe("month day slots", () => {
  it("treats the edited booking as free and keeps other rooms bookable", () => {
    const slots = dragSlotsForDay({
      date: "2026-09-14",
      roomIds: ["room-a", "room-b"],
      exceptBookingId: "own-1",
      slots: [
        {
          roomId: "room-a",
          localStart: "09:00",
          localEnd: "09:30",
          state: "my-booking",
          ownBookingId: "own-1",
        },
        {
          roomId: "room-b",
          localStart: "09:00",
          localEnd: "09:30",
          state: "available",
        },
        {
          roomId: "room-a",
          localStart: "09:30",
          localEnd: "10:00",
          state: "booked",
        },
        {
          roomId: "room-b",
          localStart: "09:30",
          localEnd: "10:00",
          state: "available",
        },
      ],
    });

    expect(slots[0]).toMatchObject({
      start: "09:00",
      available: true,
      roomIds: ["room-a", "room-b"],
    });
    expect(slots[1]).toMatchObject({
      start: "09:30",
      available: true,
      roomIds: ["room-b"],
    });
  });

  it("finds the first range that stays free in one room", () => {
    const slots = dragSlotsForDay({
      date: "2026-09-14",
      roomIds: ["room-a"],
      slots: [
        {roomId: "room-a", localStart: "10:00", localEnd: "10:30", state: "booked"},
        {roomId: "room-a", localStart: "10:30", localEnd: "11:00", state: "available"},
        {roomId: "room-a", localStart: "11:00", localEnd: "11:30", state: "available"},
      ],
    });

    expect(firstBookableRange(slots, 30, 60)).toEqual({
      start: "10:30",
      end: "11:30",
      roomIds: ["room-a"],
    });
  });
});
