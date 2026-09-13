import {describe, expect, it} from "vitest";

import type {RoomBooking, RoomStatement} from "@/db/schema";

import {buildBillingOverview, compareZurichMonth} from "./billing-overview";

function booking(
  id: string,
  startsAt: string,
  amountMinor = 4500,
): RoomBooking {
  return {
    id,
    userId: "user-1",
    roomId: "room-1",
    roomName: "Cabinet",
    startsAt: new Date(startsAt),
    endsAt: new Date(new Date(startsAt).getTime() + 60 * 60_000),
    status: "CONFIRMED",
    billingOutcome: "USAGE",
    durationMinutes: 60,
    billedMinutes: 60,
    amountMinor,
    baseHourlyRateMinor: 4500,
    discountPercent: 0,
    effectiveHourlyRateMinor: 4500,
    currency: "CHF",
    createdAt: new Date(startsAt),
    updatedAt: new Date(startsAt),
    cancelledAt: null,
    successorBookingId: null,
  } as unknown as RoomBooking;
}

function statement(
  year: number,
  month: number,
  status: RoomStatement["status"],
  totalMinor: number,
): RoomStatement {
  return {
    id: `stmt-${year}-${month}`,
    userId: "user-1",
    year,
    month,
    billedMinutes: 120,
    totalMinor,
    status,
    stripePaymentIntentId: null,
    chargeAttempt: 0,
    chargeIdempotencyKey: null,
    failureCode: null,
    finalizedAt: new Date(`${year}-${String(month).padStart(2, "0")}-02T00:00:00Z`),
    paidAt: status === "PAID" ? new Date(`${year}-${String(month).padStart(2, "0")}-03T00:00:00Z`) : null,
    createdAt: new Date(`${year}-${String(month).padStart(2, "0")}-02T00:00:00Z`),
    updatedAt: new Date(`${year}-${String(month).padStart(2, "0")}-02T00:00:00Z`),
  } as RoomStatement;
}

describe("buildBillingOverview", () => {
  it("orders months by date descending and marks the current month", () => {
    const overview = buildBillingOverview({
      bookings: [
        booking("b1", "2026-09-10T08:00:00+02:00"),
        booking("b2", "2026-10-05T08:00:00+02:00"),
      ],
      statements: [statement(2026, 8, "PAID", 9000)],
      now: new Date("2026-09-13T12:00:00+02:00"),
    });

    expect(overview.rows.map((row) => row.monthKey)).toEqual(["2026-10", "2026-09", "2026-08"]);
    expect(overview.rows.find((row) => row.monthKey === "2026-09")?.isCurrentMonth).toBe(true);
    expect(overview.rows.find((row) => row.monthKey === "2026-10")?.kind).toBe("projected");
    expect(overview.rows.find((row) => row.monthKey === "2026-08")?.kind).toBe("statement");
  });

  it("flags unsettled finalized or failed statements", () => {
    const overview = buildBillingOverview({
      bookings: [],
      statements: [
        statement(2026, 7, "PAYMENT_FAILED", 4500),
        statement(2026, 6, "FINALIZED", 3000),
        statement(2026, 5, "PAID", 2000),
      ],
      now: new Date("2026-09-13T12:00:00+02:00"),
    });

    expect(overview.unsettledStatements.map((item) => item.month)).toEqual([7, 6]);
  });
});

describe("compareZurichMonth", () => {
  it("sorts chronologically", () => {
    expect(compareZurichMonth({year: 2026, month: 9}, {year: 2026, month: 10})).toBeLessThan(0);
  });
});
