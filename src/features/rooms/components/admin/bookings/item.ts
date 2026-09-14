import type {RoomBookingStatus} from "@/db/schema";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {chargeableAmountMinor} from "@/features/rooms/billing";
import {bookingLabelKeys} from "@/features/rooms/booking-labels";
import {bookingWhen} from "@/features/rooms/format";
import type {AdminBookingRow} from "@/features/rooms/repository";
import {utcToZurich} from "@/features/rooms/timezone";
import type {AppLocale} from "@/i18n/routing";

export type AdminBookingItem = {
  id: string;
  status: RoomBookingStatus;
  statusLabel: string;
  roomName: string;
  ownerName: string;
  ownerEmail: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  billingLabel: string;
  amountLabel: string;
  chargeable: boolean;
  isToday: boolean;
};

export function presentAdminBooking(
  row: AdminBookingRow,
  locale: AppLocale,
  today: string,
  copy: {
    duration: (minutes: number) => string;
    status: (key: "statusConfirmed" | "statusCancelled") => string;
    billing: (key: ReturnType<typeof bookingLabelKeys>["billing"]) => string;
  },
): AdminBookingItem {
  const keys = bookingLabelKeys(row.booking);
  const chargeable = chargeableAmountMinor(row.booking);
  const when = bookingWhen(row.booking.startsAt, row.booking.endsAt, locale);

  return {
    id: row.booking.id,
    status: row.booking.status,
    statusLabel: copy.status(keys.status),
    roomName: row.booking.roomName,
    ownerName: `${row.owner.firstName} ${row.owner.lastName}`.trim(),
    ownerEmail: row.owner.email,
    dateLabel: when.dateLabel,
    timeLabel: when.timeLabel,
    durationLabel: copy.duration(row.booking.durationMinutes),
    billingLabel: copy.billing(keys.billing),
    amountLabel: formatChf(minorUnitsToFrancs(chargeable), locale),
    chargeable: chargeable > 0,
    isToday: utcToZurich(row.booking.startsAt).date === today,
  };
}

/** 3px rail + matching status type. Never a filled surface. */
export function bookingStatusRailClass(status: RoomBookingStatus): string {
  return status === "CANCELLED" ? "border-l-status-stop" : "border-l-status-ok";
}

export function bookingStatusTextClass(status: RoomBookingStatus): string {
  return status === "CANCELLED" ? "text-status-stop" : "text-status-ok";
}
