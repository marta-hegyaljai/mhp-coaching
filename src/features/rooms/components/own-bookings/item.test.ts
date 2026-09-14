import {describe, expect, it} from "vitest";

import type {RoomBooking} from "@/db/schema";
import {presentOwnBooking} from "./item";

function booking(overrides: Partial<RoomBooking> = {}): RoomBooking {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    createdAt: new Date("2026-09-01T08:00:00.000Z"),
    updatedAt: new Date("2026-09-01T08:00:00.000Z"),
    roomId: "22222222-2222-4222-8222-222222222222",
    userId: "33333333-3333-4333-8333-333333333333",
    createdByUserId: null,
    startsAt: new Date("2026-09-14T07:00:00.000Z"),
    endsAt: new Date("2026-09-14T09:00:00.000Z"),
    status: "CONFIRMED",
    billingOutcome: "USAGE",
    cancelledAt: null,
    cancelledByUserId: null,
    waivedAt: null,
    waivedByUserId: null,
    successorBookingId: null,
    roomName: "Cabinet A",
    baseHourlyRateMinor: 8000,
    discountPercent: 0,
    effectiveHourlyRateMinor: 8000,
    durationMinutes: 120,
    amountMinor: 16000,
    currency: "CHF",
    ...overrides,
  };
}

describe("presentOwnBooking", () => {
  it("omits owner identity and marks today", () => {
    const item = presentOwnBooking(booking(), "en", "2026-09-14", {
      duration: (minutes) => `${minutes} minutes`,
      status: (key) => key,
      billing: (key) => key,
    });
    expect(item.roomName).toBe("Cabinet A");
    expect(item.timeLabel).toBe("09:00–11:00");
    expect(item.isToday).toBe(true);
    expect(item).not.toHaveProperty("ownerName");
  });
});
