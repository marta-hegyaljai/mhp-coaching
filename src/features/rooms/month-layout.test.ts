import {describe, expect, it} from "vitest";

import {
  groupOwnBookingsByDate,
  monthBounds,
  monthWeeks,
  shiftLocalMonth,
} from "@/features/rooms/month-layout";
import {utcToZurich, zurichLocalToUtc} from "@/features/rooms/timezone";

describe("month layout", () => {
  it("builds month bounds and Monday-first weeks", () => {
    const bounds = monthBounds("2026-09-14");
    expect(bounds).toEqual({
      year: 2026,
      month: 9,
      startDate: "2026-09-01",
      endDate: "2026-09-30",
    });

    const weeks = monthWeeks(bounds);
    expect(weeks[0]).toEqual([null, "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05", "2026-09-06"]);
    expect(weeks.flat().filter(Boolean)).toContain("2026-09-30");
    expect(weeks.at(-1)?.includes("2026-09-30")).toBe(true);
  });

  it("shifts months while clamping the day", () => {
    expect(shiftLocalMonth("2026-01-31", 1)).toBe("2026-02-28");
    expect(shiftLocalMonth("2026-03-15", -1)).toBe("2026-02-15");
  });

  it("groups own bookings by local day", () => {
    const start = zurichLocalToUtc("2026-09-14", "09:00");
    const end = zurichLocalToUtc("2026-09-14", "10:30");
    expect(start.ok && end.ok).toBe(true);
    if (!start.ok || !end.ok) {
      return;
    }

    const grouped = groupOwnBookingsByDate({
      actorId: "user-1",
      bookings: [
        {
          id: "booking-1",
          userId: "user-1",
          roomId: "room-1",
          startsAt: start.instant,
          endsAt: end.instant,
          amountMinor: 6000,
        },
        {
          id: "booking-2",
          userId: "user-2",
          roomId: "room-1",
          startsAt: start.instant,
          endsAt: end.instant,
          amountMinor: 4000,
        },
      ],
      roomNames: new Map([["room-1", "Salon"]]),
      utcToLocal: utcToZurich,
    });

    expect(grouped["2026-09-14"]).toEqual([
      {
        id: "booking-1",
        roomId: "room-1",
        roomName: "Salon",
        localStart: "09:00",
        localEnd: "10:30",
        startsAt: start.instant.toISOString(),
        amountMinor: 6000,
      },
    ]);
  });
});
