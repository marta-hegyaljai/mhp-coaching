import type {ReactNode} from "react";

import type {AdminBookingQuery} from "@/features/rooms/admin-booking-query";
import {
  AdminBookingsFilters,
  type AdminBookingsFilterLabels,
} from "@/features/rooms/components/admin/bookings/toolbar/filters";
import {
  AdminBookingsViewControls,
  type AdminBookingsViewLabels,
} from "@/features/rooms/components/admin/bookings/toolbar/view-controls";
import type {AppLocale} from "@/i18n/routing";
import {Toolbar, ToolbarRow, toolbarGroupClass} from "@/shared/ui/toolbar";

export type AdminBookingsToolbarLabels = AdminBookingsViewLabels & AdminBookingsFilterLabels;

// Day view carries a date plus its step controls, so it keeps the filters on
// their own row. List view has room to put everything on one row from `lg`.
const singleRow = {
  rows: "lg:flex lg:items-center",
  scope: "lg:shrink-0",
  filters: "lg:min-w-0 lg:flex-1 lg:border-t-0 lg:border-l",
};

/**
 * The control surface directly above the list: scope and presentation first,
 * then the filter form.
 */
export function AdminBookingsToolbar({
  locale,
  query,
  today,
  labels,
  trailing,
  className = "",
}: {
  locale: AppLocale;
  query: AdminBookingQuery;
  today: string;
  labels: AdminBookingsToolbarLabels;
  /** Presentation controls that belong to the list, e.g. table or cards. */
  trailing?: ReactNode;
  className?: string;
}) {
  const inline = query.view !== "day";

  return (
    <Toolbar className={className}>
      <div className={inline ? singleRow.rows : ""}>
        <ToolbarRow className={`${toolbarGroupClass} ${inline ? singleRow.scope : ""}`}>
          <AdminBookingsViewControls
            locale={locale}
            query={query}
            today={today}
            labels={labels}
            className="min-w-0 flex-1"
          />
          {trailing}
        </ToolbarRow>
        <ToolbarRow divided className={inline ? singleRow.filters : ""}>
          <AdminBookingsFilters locale={locale} query={query} labels={labels} />
        </ToolbarRow>
      </div>
    </Toolbar>
  );
}
