import type {RoomBooking} from "@/db/schema";

import {billingCopyKey} from "./billing";

export type BookingStatusKey = "statusConfirmed" | "statusCancelled";
export type BookingBillingKey = ReturnType<typeof billingCopyKey>;

/**
 * Single source for the `Rooms` message keys a booking resolves to, so the
 * lists, cards and detail screens cannot drift apart.
 */
export function bookingLabelKeys(
  booking: Pick<RoomBooking, "status" | "billingOutcome">,
): {status: BookingStatusKey; billing: BookingBillingKey} {
  return {
    status: booking.status === "CANCELLED" ? "statusCancelled" : "statusConfirmed",
    billing: billingCopyKey(booking),
  };
}
