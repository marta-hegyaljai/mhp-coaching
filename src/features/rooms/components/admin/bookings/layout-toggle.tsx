"use client";

import {
  AdminBookingsLayoutSwitch,
  useAdminBookingsLayout,
} from "@/features/rooms/components/admin/bookings/layout-switch";

/**
 * The table/cards control, placed in the toolbar. It shares the stored
 * preference with the list, so both stay in sync without prop drilling.
 */
export function AdminBookingsLayoutToggle({
  label,
  tableLabel,
  cardsLabel,
}: {
  label: string;
  tableLabel: string;
  cardsLabel: string;
}) {
  const [layout, setLayout] = useAdminBookingsLayout();

  return (
    <AdminBookingsLayoutSwitch
      label={label}
      tableLabel={tableLabel}
      cardsLabel={cardsLabel}
      value={layout}
      onChange={setLayout}
    />
  );
}
