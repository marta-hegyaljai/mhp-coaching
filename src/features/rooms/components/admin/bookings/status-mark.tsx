import {bookingStatusTextClass} from "@/features/rooms/components/admin/bookings/item";
import type {AdminBookingItem} from "@/features/rooms/components/admin/bookings/item";

export function BookingStatusMark({item}: {item: AdminBookingItem}) {
  return (
    <p
      className={`text-[0.7rem] font-bold uppercase tracking-[0.2em] ${bookingStatusTextClass(item.status)}`}
    >
      {item.statusLabel}
    </p>
  );
}
