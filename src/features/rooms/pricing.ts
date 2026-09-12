export type RoomBookingQuote = {
  baseHourlyRateMinor: number;
  discountPercent: number;
  effectiveHourlyRateMinor: number;
  durationMinutes: number;
  amountMinor: number;
  currency: "CHF";
};

export const MAX_ROOM_DISCOUNT_PERCENT = 99;

export function normalizeDiscountPercent(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > MAX_ROOM_DISCOUNT_PERCENT) {
    throw new Error("invalidDiscount");
  }
  return value;
}

/**
 * Server-side room quote in integer minor units (centimes) and integer minutes.
 *
 * Rounding is half-up via `Math.round` at each step — never floating francs:
 * 1. `effectiveHourlyRateMinor = round(baseHourlyRateMinor * (100 - discountPercent) / 100)`
 * 2. `amountMinor = round(effectiveHourlyRateMinor * durationMinutes / 60)`
 *
 * The base hourly rate is preserved on the snapshot so a later catalogue or
 * discount change cannot rewrite history.
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

export function therapistDiscountPercent(user: {roomDiscountPercent: number}): number {
  return normalizeDiscountPercent(user.roomDiscountPercent);
}

export function durationMinutesBetween(startsAt: Date, endsAt: Date): number {
  const minutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000);
  if (minutes <= 0) {
    throw new Error("invalidDuration");
  }
  return minutes;
}
