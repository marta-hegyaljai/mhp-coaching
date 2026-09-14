"use client";

import {AdminBookingCardGrid} from "@/features/rooms/components/admin/bookings/booking-card";
import {
  AdminBookingTable,
  type AdminBookingTableLabels,
} from "@/features/rooms/components/admin/bookings/booking-table";
import type {AdminBookingItem} from "@/features/rooms/components/admin/bookings/item";
import {useAdminBookingsLayout} from "@/features/rooms/components/admin/bookings/layout-switch";

export function AdminBookingListResults({
  items,
  openLabel,
  tableLabels,
}: {
  items: AdminBookingItem[];
  openLabel: string;
  tableLabels: AdminBookingTableLabels;
}) {
  const [layout] = useAdminBookingsLayout();
  const cards = (
    <AdminBookingCardGrid items={items} openLabel={openLabel} todayLabel={tableLabels.today} />
  );

  return (
    <>
      <div className="lg:hidden">{cards}</div>
      <div className="hidden lg:block">
        {layout === "table" ? <AdminBookingTable items={items} labels={tableLabels} /> : cards}
      </div>
    </>
  );
}
