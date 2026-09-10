import type {Booking} from "@/db/schema";
import {sendBookingConfirmation} from "@/features/email/booking-confirmation";
import {sendPurchaseNotification} from "@/features/email/purchase-notification";
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

    if (!alreadyPaid) {
      await notifyPaidPurchase(paidBooking);
    }

    return {ok: true};
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
    await notifyFailedPurchase(updatedBooking);
  }

  return {ok: true};
}

async function notifyPaidPurchase(booking: Booking): Promise<void> {
  if (!booking.confirmationEmailSentAt) {
    try {
      await sendBookingConfirmation(booking);
      await markConfirmationEmailSent(booking.id);
    } catch (error) {
      console.error("Failed to send booking confirmation email", error);
    }
  }

  try {
    await sendPurchaseNotification(booking, "paid");
  } catch (error) {
    console.error("Failed to send staff purchase notification", error);
  }
}

async function notifyFailedPurchase(booking: Booking): Promise<void> {
  try {
    await sendPurchaseNotification(booking, "failed");
  } catch (error) {
    console.error("Failed to send staff purchase notification", error);
  }
}
