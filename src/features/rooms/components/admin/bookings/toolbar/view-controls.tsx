import type {AdminBookingQuery} from "@/features/rooms/admin-booking-query";
import {adminBookingListHref} from "@/features/rooms/admin-booking-query";
import {AdminBookingDayJump} from "@/features/rooms/components/admin/bookings/day-jump";
import {addLocalDays} from "@/features/rooms/timezone";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {formatWeekdayDate} from "@/shared/format/calendar-date";
import {ChevronLeftIcon, ChevronRightIcon} from "@/shared/ui/icons";
import {SegmentedLinks} from "@/shared/ui/segmented-links";

export type AdminBookingsViewLabels = {
  view: string;
  list: string;
  day: string;
  today: string;
  previousDay: string;
  nextDay: string;
  jumpToDate: string;
  includesToday: string;
  timezone: string;
};

const stepClass =
  "inline-flex min-h-11 items-center justify-center px-3 text-xs font-semibold uppercase tracking-[0.1em] text-ink transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const markClass = "text-[0.7rem] font-bold uppercase tracking-[0.16em]";

/**
 * List/Day scope plus, in Day view, the exact Zurich day the grid renders and
 * the controls that move it.
 */
export function AdminBookingsViewControls({
  locale,
  query,
  today,
  labels,
  className = "",
}: {
  locale: AppLocale;
  query: AdminBookingQuery;
  today: string;
  labels: AdminBookingsViewLabels;
  className?: string;
}) {
  const isDay = query.view === "day";
  const previousDate = addLocalDays(query.date, -1);
  const nextDate = addLocalDays(query.date, 1);

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-3 ${className}`}>
      <SegmentedLinks
        label={labels.view}
        items={[
          {
            key: "list",
            href: adminBookingListHref({...query, view: "list", page: 1}),
            label: labels.list,
            current: !isDay,
          },
          {
            key: "day",
            href: adminBookingListHref({
              ...query,
              view: "day",
              date: isDay ? query.date : today,
              page: 1,
            }),
            label: labels.day,
            current: isDay,
          },
        ]}
      />

      {isDay ? (
        <>
          <p className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-sans text-sm font-semibold tabular-nums text-ink">
              {formatWeekdayDate(query.date, locale)}
            </span>
            <span className={`${markClass} text-ink-subtle`}>{labels.timezone}</span>
            {query.date === today ? (
              <span className={`${markClass} text-gold-deep`}>{labels.includesToday}</span>
            ) : null}
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <AdminBookingDayJump locale={locale} query={query} label={labels.jumpToDate} />
            <div className="inline-flex rounded-panel border border-ink bg-white">
              <Link
                href={adminBookingListHref({...query, view: "day", date: previousDate, page: 1})}
                aria-label={labels.previousDay}
                className={stepClass}
              >
                <ChevronLeftIcon />
              </Link>
              <Link
                href={adminBookingListHref({...query, view: "day", date: today, page: 1})}
                className={`${stepClass} border-x border-ink`}
              >
                {labels.today}
              </Link>
              <Link
                href={adminBookingListHref({...query, view: "day", date: nextDate, page: 1})}
                aria-label={labels.nextDay}
                className={stepClass}
              >
                <ChevronRightIcon />
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
