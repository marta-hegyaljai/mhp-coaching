import {BookingStatusMark} from "@/features/rooms/components/booking-list/status-mark";
import type {AdminBookingItem} from "@/features/rooms/components/admin/bookings/item";

export function AdminBookingStatusMark({item}: {item: AdminBookingItem}) {
  return <BookingStatusMark status={item.status} label={item.statusLabel} />;
}

export {AdminBookingStatusMark as BookingStatusMark};
