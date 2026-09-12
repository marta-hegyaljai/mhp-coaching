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

  it("rounds each step in integer minor units", () => {
    expect(
      quoteRoomBooking({
        hourlyRateMinor: 3500,
        durationMinutes: 90,
        discountPercent: 10,
      }),
    ).toEqual({
      baseHourlyRateMinor: 3500,
      discountPercent: 10,
      effectiveHourlyRateMinor: 3150,
      durationMinutes: 90,
      amountMinor: 4725,
      currency: "CHF",
    });

    expect(
      quoteRoomBooking({
        hourlyRateMinor: 3500,
        durationMinutes: 90,
        discountPercent: 33,
      }),
    ).toEqual({
      baseHourlyRateMinor: 3500,
      discountPercent: 33,
      effectiveHourlyRateMinor: 2345,
      durationMinutes: 90,
      amountMinor: 3518,
      currency: "CHF",
    });
  });

  it("reads the therapist discount from the user record", () => {
    expect(therapistDiscountPercent({roomDiscountPercent: 0})).toBe(0);
    expect(therapistDiscountPercent({roomDiscountPercent: 15})).toBe(15);
    expect(() => therapistDiscountPercent({roomDiscountPercent: 100})).toThrow("invalidDiscount");
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
    ).toThrow("invalidDiscount");
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
