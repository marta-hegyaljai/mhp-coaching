import {getTranslations} from "next-intl/server";

import type {RoomBooking} from "@/db/schema";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {chargeableAmountMinor} from "@/features/rooms/billing";
import {bookingLabelKeys} from "@/features/rooms/booking-labels";
import {BookingSummaryCard} from "@/features/rooms/components/booking/summary-card";
import {bookingWhen} from "@/features/rooms/format";
import type {AppLocale} from "@/i18n/routing";

/** The same card as the therapist list, plus whose booking it is. */
export async function AdminBookingCard({
  booking,
  owner,
  locale,
}: {
  booking: RoomBooking;
  owner: {firstName: string; lastName: string; email: string};
  locale: AppLocale;
}) {
  const t = await getTranslations("Rooms");
  const keys = bookingLabelKeys(booking);
  const chargeable = chargeableAmountMinor(booking);

  return (
    <BookingSummaryCard
      href={{pathname: "/admin/bookings/[id]", params: {id: booking.id}}}
      statusLabel={t(keys.status)}
      cancelled={booking.status === "CANCELLED"}
      roomName={booking.roomName}
      ownerLabel={`${owner.firstName} ${owner.lastName} · ${owner.email}`}
      when={bookingWhen(booking.startsAt, booking.endsAt, locale)}
      durationLabel={t("bookDuration", {minutes: booking.durationMinutes})}
      billingLabel={t(keys.billing)}
      amountLabel={formatChf(minorUnitsToFrancs(chargeable), locale)}
      chargeable={chargeable > 0}
    />
  );
}
