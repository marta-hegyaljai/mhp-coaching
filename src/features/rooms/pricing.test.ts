import {describe, expect, it} from "vitest";

import {
  durationMinutesBetween,
  quoteRoomBooking,
  therapistDiscountPercent,
} from "./pricing";

describe("quoteRoomBooking", () => {
  it("prices a 90-minute slot at the hourly rate with a zero discount", () => {
    expect(
      quoteRoomBooking({
        hourlyRateMinor: 4000,
        durationMinutes: 90,
        discountPercent: 0,
      }),
    ).toEqual({
      baseHourlyRateMinor: 4000,
      discountPercent: 0,
      effectiveHourlyRateMinor: 4000,
      durationMinutes: 90,
      amountMinor: 6000,
      currency: "CHF",
    });
  });

  it("applies a percentage discount without rewriting the base rate", () => {
    expect(
      quoteRoomBooking({
        hourlyRateMinor: 4000,
        durationMinutes: 60,
        discountPercent: 25,
      }),
    ).toEqual({
      baseHourlyRateMinor: 4000,
      discountPercent: 25,
      effectiveHourlyRateMinor: 3000,
      durationMinutes: 60,
      amountMinor: 3000,
      currency: "CHF",
    });
  });

  it("keeps the therapist discount path at zero until CP-08", () => {
    expect(therapistDiscountPercent({id: "anyone"})).toBe(0);
    expect(
      quoteRoomBooking({
        hourlyRateMinor: 3500,
        durationMinutes: 120,
        discountPercent: therapistDiscountPercent({id: "anyone"}),
      }).amountMinor,
    ).toBe(7000);
  });

  it("rejects impossible rates, durations and discounts", () => {
    expect(() =>
      quoteRoomBooking({hourlyRateMinor: 0, durationMinutes: 60}),
    ).toThrow("invalidPrice");
    expect(() =>
      quoteRoomBooking({hourlyRateMinor: 4000, durationMinutes: 0}),
    ).toThrow("invalidDuration");
    expect(() =>
      quoteRoomBooking({
        hourlyRateMinor: 4000,
        durationMinutes: 60,
        discountPercent: 101,
      }),
    ).toThrow("invalidDiscount");
    expect(() =>
      quoteRoomBooking({
        hourlyRateMinor: 4000,
        durationMinutes: 60,
        discountPercent: 100,
      }),
    ).toThrow("invalidPrice");
  });

  it("measures duration from timezone-aware instants", () => {
    expect(
      durationMinutesBetween(
        new Date("2026-09-14T12:00:00.000Z"),
        new Date("2026-09-14T13:30:00.000Z"),
      ),
    ).toBe(90);
  });
});
