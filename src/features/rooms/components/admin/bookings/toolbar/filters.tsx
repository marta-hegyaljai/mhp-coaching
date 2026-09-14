import type {AdminBookingQuery} from "@/features/rooms/admin-booking-query";
import {adminBookingListHref, showsCancelledBookings} from "@/features/rooms/admin-booking-query";
import {localizedPath} from "@/features/seo/metadata";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {Button} from "@/shared/ui/button";
import {InputField} from "@/shared/ui/field";
import {FilterBar} from "@/shared/ui/filter-bar";

export type AdminBookingsFilterLabels = {
  filter: string;
  clearFilters: string;
  search: string;
  searchPlaceholder: string;
  showCancelled: string;
};

/** The `GET` row that narrows the list; clearing keeps the current view. */
export function AdminBookingsFilters({
  locale,
  query,
  labels,
}: {
  locale: AppLocale;
  query: AdminBookingQuery;
  labels: AdminBookingsFilterLabels;
}) {
  const isDay = query.view === "day";

  return (
    <FilterBar
      action={localizedPath(locale, "/admin/bookings")}
      label={labels.filter}
      frame="inline"
      columnsClassName="sm:grid-cols-[minmax(0,1fr)_auto_auto]"
      actions={
        <>
          <Button type="submit" variant="secondary">
            {labels.filter}
          </Button>
          <Link
            href={adminBookingListHref({
              q: "",
              status: "CONFIRMED",
              view: query.view,
              date: query.date,
              page: 1,
            })}
            className="text-sm underline-offset-4 hover:underline"
          >
            {labels.clearFilters}
          </Link>
        </>
      }
    >
      <InputField
        id="booking-search"
        name="q"
        type="search"
        size="sm"
        label={labels.search}
        labelHidden
        placeholder={labels.searchPlaceholder}
        defaultValue={query.q}
        autoComplete="off"
      />
      <label className="flex min-h-11 items-center gap-3 text-sm text-ink">
        <input
          type="checkbox"
          name="status"
          value="all"
          defaultChecked={showsCancelledBookings(query.status)}
          className="h-4 w-4 rounded-panel border-ink"
        />
        {labels.showCancelled}
        {isDay ? (
          <>
            <input type="hidden" name="view" value="day" />
            <input type="hidden" name="date" value={query.date} />
          </>
        ) : null}
      </label>
    </FilterBar>
  );
}
