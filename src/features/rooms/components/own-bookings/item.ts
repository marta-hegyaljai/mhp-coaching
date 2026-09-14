import type {RoomBooking, RoomBookingStatus} from "@/db/schema";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {chargeableAmountMinor} from "@/features/rooms/billing";
import {bookingLabelKeys} from "@/features/rooms/booking-labels";
import {bookingWhen} from "@/features/rooms/format";
import {utcToZurich} from "@/features/rooms/timezone";
import type {AppLocale} from "@/i18n/routing";

export type OwnBookingItem = {
  id: string;
  status: RoomBookingStatus;
  statusLabel: string;
  roomName: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  billingLabel: string;
  amountLabel: string;
  chargeable: boolean;
  isToday: boolean;
};

export function presentOwnBooking(
  booking: RoomBooking,
  locale: AppLocale,
  today: string,
  copy: {
    duration: (minutes: number) => string;
    status: (key: "statusConfirmed" | "statusCancelled") => string;
    billing: (key: ReturnType<typeof bookingLabelKeys>["billing"]) => string;
  },
): OwnBookingItem {
  const keys = bookingLabelKeys(booking);
  const chargeable = chargeableAmountMinor(booking);
  const when = bookingWhen(booking.startsAt, booking.endsAt, locale);

  return {
    id: booking.id,
    status: booking.status,
    statusLabel: copy.status(keys.status),
    roomName: booking.roomName,
    dateLabel: when.dateLabel,
    timeLabel: when.timeLabel,
    durationLabel: copy.duration(booking.durationMinutes),
    billingLabel: copy.billing(keys.billing),
    amountLabel: formatChf(minorUnitsToFrancs(chargeable), locale),
    chargeable: chargeable > 0,
    isToday: utcToZurich(booking.startsAt).date === today,
  };
}
