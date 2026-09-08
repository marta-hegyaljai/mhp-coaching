import {sendBookingConfirmation} from "@/features/email/booking-confirmation";
import {
  getBookingById,
  markBookingPaidOnce,
  markBookingStatus,
  markConfirmationEmailSent,
  recordPaymentEvent,
} from "@/features/bookings/repository";

export async function applyPaymentEvent(input: {
  bookingId: string;
  provider: string;
  providerEventId: string;
  type: "paid" | "cancelled" | "failed";
  payload?: unknown;
}): Promise<{ok: true; alreadyProcessed?: boolean} | {ok: false; reason: string}> {
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

  if (eventResult === "duplicate") {
    return {ok: true, alreadyProcessed: true};
  }

  if (input.type === "paid") {
    const {booking: paidBooking, alreadyPaid} = await markBookingPaidOnce(
      input.bookingId,
    );

    if (!alreadyPaid && !paidBooking.confirmationEmailSentAt) {
      try {
        await sendBookingConfirmation(paidBooking);
        await markConfirmationEmailSent(paidBooking.id);
      } catch (error) {
        console.error("Failed to send booking confirmation email", error);
      }
    }

    return {ok: true};
  }

  if (booking.status === "PAID") {
    return {ok: true, alreadyProcessed: true};
  }

  await markBookingStatus({
    bookingId: input.bookingId,
    status: input.type === "failed" ? "FAILED" : "CANCELLED",
  });

  return {ok: true};
}
