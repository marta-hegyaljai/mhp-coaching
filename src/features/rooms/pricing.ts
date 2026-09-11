export type RoomBookingQuote = {
  baseHourlyRateMinor: number;
  discountPercent: number;
  effectiveHourlyRateMinor: number;
  durationMinutes: number;
  amountMinor: number;
  currency: "CHF";
};

export function normalizeDiscountPercent(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new Error("invalidDiscount");
  }
  return value;
}

/**
 * Server-side room quote. Discount stays 0 until CP-08; the path already
 * applies a percentage so historical snapshots can hold a non-zero value.
 */
export function quoteRoomBooking(input: {
  hourlyRateMinor: number;
  durationMinutes: number;
  discountPercent?: number;
}): RoomBookingQuote {
  if (!Number.isInteger(input.hourlyRateMinor) || input.hourlyRateMinor <= 0) {
    throw new Error("invalidPrice");
  }
  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0) {
    throw new Error("invalidDuration");
  }

  const discountPercent = normalizeDiscountPercent(input.discountPercent ?? 0);
  const effectiveHourlyRateMinor = Math.round(
    (input.hourlyRateMinor * (100 - discountPercent)) / 100,
  );
  if (effectiveHourlyRateMinor <= 0) {
    throw new Error("invalidPrice");
  }

  const amountMinor = Math.round((effectiveHourlyRateMinor * input.durationMinutes) / 60);
  if (amountMinor <= 0) {
    throw new Error("invalidPrice");
  }

  return {
    baseHourlyRateMinor: input.hourlyRateMinor,
    discountPercent,
    effectiveHourlyRateMinor,
    durationMinutes: input.durationMinutes,
    amountMinor,
    currency: "CHF",
  };
}

/** Until CP-08 every therapist discount is zero. */
export function therapistDiscountPercent(user: {id: string}): number {
  void user.id;
  return 0;
}

export function durationMinutesBetween(startsAt: Date, endsAt: Date): number {
  const minutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000);
  if (minutes <= 0) {
    throw new Error("invalidDuration");
  }
  return minutes;
}
