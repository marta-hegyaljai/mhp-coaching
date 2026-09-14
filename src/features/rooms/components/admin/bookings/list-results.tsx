"use client";

import {AdminBookingCardGrid} from "@/features/rooms/components/admin/bookings/booking-card";
import {
  AdminBookingTable,
  type AdminBookingTableLabels,
} from "@/features/rooms/components/admin/bookings/booking-table";
import type {AdminBookingItem} from "@/features/rooms/components/admin/bookings/item";
import {
  AdminBookingsLayoutSwitch,
  useAdminBookingsLayout,
} from "@/features/rooms/components/admin/bookings/layout-switch";

export function AdminBookingListResults({
  items,
  openLabel,
  layoutLabel,
  tableLabel,
  cardsLabel,
  tableLabels,
}: {
  items: AdminBookingItem[];
  openLabel: string;
  layoutLabel: string;
  tableLabel: string;
  cardsLabel: string;
  tableLabels: AdminBookingTableLabels;
}) {
  const [layout, setLayout] = useAdminBookingsLayout();

  return (
    <div>
      <div className="mb-4 hidden justify-end lg:flex">
        <AdminBookingsLayoutSwitch
          label={layoutLabel}
          tableLabel={tableLabel}
          cardsLabel={cardsLabel}
          value={layout}
          onChange={setLayout}
        />
      </div>
      <div className="lg:hidden">
        <AdminBookingCardGrid items={items} openLabel={openLabel} />
      </div>
      <div className="hidden lg:block">
        {layout === "table" ? (
          <AdminBookingTable items={items} labels={tableLabels} />
        ) : (
          <AdminBookingCardGrid items={items} openLabel={openLabel} />
        )}
      </div>
    </div>
  );
}
