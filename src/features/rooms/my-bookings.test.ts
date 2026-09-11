import {describe, expect, it} from "vitest";

import type {RoomBooking} from "@/db/schema";

import {splitOwnBookings} from "./my-bookings";

function booking(partial: Partial<RoomBooking> & Pick<RoomBooking, "id" | "startsAt" | "endsAt" | "status">): RoomBooking {
  return {
    createdAt: new Date("2026-09-01T08:00:00.000Z"),
    updatedAt: new Date("2026-09-01T08:00:00.000Z"),
    roomId: "11111111-1111-4111-8111-111111111111",
    userId: "22222222-2222-4222-8222-222222222222",
    createdByUserId: "22222222-2222-4222-8222-222222222222",
    roomName: "Salon",
    baseHourlyRateMinor: 4000,
    discountPercent: 0,
    effectiveHourlyRateMinor: 4000,
    durationMinutes: 60,
    amountMinor: 4000,
    currency: "CHF",
    billingOutcome: "USAGE",
    cancelledAt: null,
    cancelledByUserId: null,
    waivedAt: null,
    waivedByUserId: null,
    successorBookingId: null,
    ...partial,
  };
}

describe("splitOwnBookings", () => {
  const now = new Date("2026-09-14T12:00:00.000Z");

  it("keeps current and future confirmed bookings in upcoming", () => {
    const current = booking({
      id: "current",
      status: "CONFIRMED",
      startsAt: new Date("2026-09-14T11:00:00.000Z"),
      endsAt: new Date("2026-09-14T13:00:00.000Z"),
    });
    const future = booking({
      id: "future",
      status: "CONFIRMED",
      startsAt: new Date("2026-09-21T10:00:00.000Z"),
      endsAt: new Date("2026-09-21T11:00:00.000Z"),
    });
    const past = booking({
      id: "past",
      status: "CONFIRMED",
      startsAt: new Date("2026-09-10T10:00:00.000Z"),
      endsAt: new Date("2026-09-10T11:00:00.000Z"),
    });
    const cancelled = booking({
      id: "cancelled",
      status: "CANCELLED",
      startsAt: new Date("2026-09-21T14:00:00.000Z"),
      endsAt: new Date("2026-09-21T15:00:00.000Z"),
    });

    const lists = splitOwnBookings([past, cancelled, future, current], now);
    expect(lists.upcoming.map((item) => item.id)).toEqual(["current", "future"]);
    expect(lists.history.map((item) => item.id)).toEqual(["cancelled", "past"]);
  });
});
