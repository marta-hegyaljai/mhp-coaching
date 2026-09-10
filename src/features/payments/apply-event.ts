import {
  getBookingById,
  markBookingPaidOnce,
  markBookingStatus,
  recordPaymentEvent,
} from "@/features/bookings/repository";
import {
  sendBuyerConfirmationIfNeeded,
  sendStaffFailedNotification,
  sendStaffPaidNotification,
} from "@/features/email/paid-booking";

export type ApplyPaymentEventResult =
  | {
      ok: true;
      alreadyProcessed?: boolean;
      confirmationEmailSent?: boolean;
    }
  | {ok: false; reason: string};

export async function applyPaymentEvent(input: {
  bookingId: string;
  provider: string;
  providerEventId: string;
  type: "paid" | "cancelled" | "failed";
  payload?: unknown;
}): Promise<ApplyPaymentEventResult> {
  const booking = await getBookingById(input.bookingId);

  if (!booking) {
    return {ok: false, reason: "booking_not_found"};
  }

  const eventResult = await recordPaymentEvent({
    bookingId: input.bookingId,
    provider: input.provider,
    providerEventId: input.providerEventId,
    type: input.type,
    payload: input.payload,
  });
  const isDuplicate = eventResult === "duplicate";

  if (input.type === "paid") {
    const {booking: paidBooking, alreadyPaid} = await markBookingPaidOnce(
      input.bookingId,
    );
    const confirmationEmailSent =
      await sendBuyerConfirmationIfNeeded(paidBooking);

    if (!alreadyPaid) {
      await sendStaffPaidNotification(paidBooking);
    }

    return {
      ok: true,
      ...(isDuplicate || alreadyPaid ? {alreadyProcessed: true} : {}),
      confirmationEmailSent,
    };
  }

  if (isDuplicate) {
    return {ok: true, alreadyProcessed: true};
  }

  if (booking.status === "PAID") {
    return {ok: true, alreadyProcessed: true};
  }

  const updatedBooking =
    (await markBookingStatus({
      bookingId: input.bookingId,
      status: input.type === "failed" ? "FAILED" : "CANCELLED",
    })) ?? booking;

  if (input.type === "failed") {
    await sendStaffFailedNotification(updatedBooking);
  }

  return {ok: true};
}
