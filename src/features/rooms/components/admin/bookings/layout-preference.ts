import {
  ADMIN_BOOKINGS_LAYOUT_KEY,
  isBookingsLayout,
  readBookingsLayout,
  writeBookingsLayout,
  type BookingsLayout,
} from "@/features/rooms/components/booking-list/layout";

export {
  ADMIN_BOOKINGS_LAYOUT_KEY,
  isBookingsLayout as isAdminBookingsLayout,
  type BookingsLayout as AdminBookingsLayout,
};

export function readAdminBookingsLayout(): BookingsLayout {
  return readBookingsLayout(ADMIN_BOOKINGS_LAYOUT_KEY);
}

export function writeAdminBookingsLayout(layout: BookingsLayout): void {
  writeBookingsLayout(ADMIN_BOOKINGS_LAYOUT_KEY, layout);
}
