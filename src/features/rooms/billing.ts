import type {RoomBooking, RoomBookingBillingOutcome} from "@/db/schema";

export type BookingEventAction =
  | "CREATED"
  | "MOVED"
  | "CANCELLED"
  | "WAIVED"
  | "ADMIN_CREATED"
  | "ADMIN_MOVED";

const HOUR_MS = 60 * 60 * 1000;

export function isFreeCancellation(
  startsAt: Date,
  now: Date,
  noticeHours: number,
): boolean {
  return startsAt.getTime() - now.getTime() > noticeHours * HOUR_MS;
}

export function cancellationOutcome(
  startsAt: Date,
  now: Date,
  noticeHours: number,
): Extract<RoomBookingBillingOutcome, "FREE_CANCELLATION" | "LATE_CANCELLATION"> {
  return isFreeCancellation(startsAt, now, noticeHours)
    ? "FREE_CANCELLATION"
    : "LATE_CANCELLATION";
}

export function isChargeableOutcome(
  booking: Pick<RoomBooking, "status" | "billingOutcome">,
): boolean {
  if (booking.billingOutcome === "LATE_CANCELLATION") {
    return true;
  }
  return booking.status === "CONFIRMED" && booking.billingOutcome === "USAGE";
}

export function chargeableAmountMinor(
  booking: Pick<RoomBooking, "status" | "billingOutcome" | "amountMinor">,
): number {
  return isChargeableOutcome(booking) ? booking.amountMinor : 0;
}

/** Minutes that contribute to open-month usage. Free cancellations and waivers are 0. */
export function billedMinutes(
  booking: Pick<RoomBooking, "status" | "billingOutcome" | "durationMinutes">,
): number {
  return isChargeableOutcome(booking) ? booking.durationMinutes : 0;
}

export function billingCopyKey(
  booking: Pick<RoomBooking, "status" | "billingOutcome">,
): "billingUsage" | "billingFree" | "billingLate" | "billingWaived" {
  if (booking.billingOutcome === "FREE_CANCELLATION") {
    return "billingFree";
  }
  if (booking.billingOutcome === "LATE_CANCELLATION") {
    return "billingLate";
  }
  if (booking.billingOutcome === "WAIVED") {
    return "billingWaived";
  }
  return "billingUsage";
}

export type BookingHistorySnapshot = {
  status: RoomBooking["status"];
  roomId: string;
  roomName: string;
  startsAt: string;
  endsAt: string;
  amountMinor: number;
  billingOutcome: RoomBookingBillingOutcome;
  durationMinutes: number;
  successorBookingId: string | null;
};

export function bookingHistorySnapshot(booking: RoomBooking): BookingHistorySnapshot {
  return {
    status: booking.status,
    roomId: booking.roomId,
    roomName: booking.roomName,
    startsAt: booking.startsAt.toISOString(),
    endsAt: booking.endsAt.toISOString(),
    amountMinor: booking.amountMinor,
    billingOutcome: booking.billingOutcome,
    durationMinutes: booking.durationMinutes,
    successorBookingId: booking.successorBookingId,
  };
}

export function auditBookingSnapshot(booking: RoomBooking): Record<string, unknown> {
  return {
    bookingId: booking.id,
    ...bookingHistorySnapshot(booking),
    currency: booking.currency,
    discountPercent: booking.discountPercent,
  };
}
