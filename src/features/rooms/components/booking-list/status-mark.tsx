import type {RoomBookingStatus} from "@/db/schema";

import {bookingStatusTextClass} from "@/features/rooms/components/booking-list/status";

export function BookingStatusMark({
  status,
  label,
}: {
  status: RoomBookingStatus;
  label: string;
}) {
  return (
    <p
      className={`text-[0.7rem] font-bold uppercase tracking-[0.2em] ${bookingStatusTextClass(status)}`}
    >
      {label}
    </p>
  );
}
