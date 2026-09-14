"use client";

import {useRouter} from "@/i18n/navigation";
import type {AdminBookingQuery} from "@/features/rooms/admin-booking-query";
import {adminBookingListHref} from "@/features/rooms/admin-booking-query";
import {localizedPathname} from "@/i18n/path";
import type {AppLocale} from "@/i18n/routing";
import {DateField} from "@/shared/ui/date-field";

export function AdminBookingDayJump({
  locale,
  query,
  label,
}: {
  locale: AppLocale;
  query: AdminBookingQuery;
  label: string;
}) {
  const router = useRouter();

  return (
    <form
      method="get"
      action={localizedPathname(locale, "/admin/bookings")}
      className="min-w-[12.5rem]"
      onChange={(event) => {
        const form = event.currentTarget;
        const data = new FormData(form);
        const date = String(data.get("date") ?? "");
        if (!date || date === query.date) {
          return;
        }
        router.push(adminBookingListHref({...query, view: "day", date, page: 1}), {scroll: false});
      }}
    >
      {query.q ? <input type="hidden" name="q" value={query.q} /> : null}
      {query.status !== "CONFIRMED" ? <input type="hidden" name="status" value={query.status} /> : null}
      <input type="hidden" name="view" value="day" />
      <DateField id="admin-booking-day" name="date" size="sm" required value={query.date} aria-label={label} />
    </form>
  );
}
