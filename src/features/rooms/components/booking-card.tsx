import {getTranslations} from "next-intl/server";

import type {RoomBooking} from "@/db/schema";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {chargeableAmountMinor} from "@/features/rooms/billing";
import {bookingLabelKeys} from "@/features/rooms/booking-labels";
import {BookingSummaryCard} from "@/features/rooms/components/booking/summary-card";
import {bookingWhen} from "@/features/rooms/format";
import type {AppLocale} from "@/i18n/routing";

/** The therapist's own booking in a list: no owner line, own detail route. */
export async function RoomBookingCard({
  booking,
  locale,
}: {
  booking: RoomBooking;
  locale: AppLocale;
}) {
  const t = await getTranslations("Rooms");
  const keys = bookingLabelKeys(booking);
  const chargeable = chargeableAmountMinor(booking);

  return (
    <BookingSummaryCard
      href={{pathname: "/rooms/bookings/[id]", params: {id: booking.id}}}
      statusLabel={t(keys.status)}
      cancelled={booking.status === "CANCELLED"}
      roomName={booking.roomName}
      when={bookingWhen(booking.startsAt, booking.endsAt, locale)}
      durationLabel={t("bookDuration", {minutes: booking.durationMinutes})}
      billingLabel={t(keys.billing)}
      amountLabel={formatChf(minorUnitsToFrancs(chargeable), locale)}
      chargeable={chargeable > 0}
    />
  );
}
