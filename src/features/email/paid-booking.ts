import type {Booking} from "@/db/schema";
import {markConfirmationEmailSent} from "@/features/bookings/repository";

import {sendBookingConfirmation} from "./booking-confirmation";
import {sendPurchaseNotification} from "./purchase-notification";

export async function sendBuyerConfirmationIfNeeded(
  booking: Booking,
): Promise<boolean> {
  if (booking.confirmationEmailSentAt) {
    return true;
  }

  try {
    await sendBookingConfirmation(booking);
    await markConfirmationEmailSent(booking.id);
    return true;
  } catch (error) {
    console.error("Failed to send booking confirmation email", error);
    return false;
  }
}

export async function sendStaffPaidNotification(booking: Booking): Promise<void> {
  try {
    await sendPurchaseNotification(booking, "paid");
  } catch (error) {
    console.error("Failed to send staff purchase notification", error);
  }
}

export async function sendStaffFailedNotification(
  booking: Booking,
): Promise<void> {
  try {
    await sendPurchaseNotification(booking, "failed");
  } catch (error) {
    console.error("Failed to send staff purchase notification", error);
  }
}
