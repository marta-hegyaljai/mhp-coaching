"use client";

import {ADMIN_BOOKINGS_LAYOUT_KEY} from "@/features/rooms/components/booking-list/layout";
import {
  BookingsLayoutSwitch,
  useBookingsLayout,
} from "@/features/rooms/components/booking-list/layout-switch";

export {BookingsLayoutSwitch as AdminBookingsLayoutSwitch};

export function useAdminBookingsLayout() {
  return useBookingsLayout(ADMIN_BOOKINGS_LAYOUT_KEY);
}
