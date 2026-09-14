import type {AdminBookingQuery} from "@/features/rooms/admin-booking-query";
import {adminBookingListHref} from "@/features/rooms/admin-booking-query";
import {AdminBookingDayJump} from "@/features/rooms/components/admin/bookings/day-jump";
import {addLocalDays} from "@/features/rooms/timezone";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {formatWeekdayDate} from "@/shared/format/calendar-date";
import {ChevronLeftIcon, ChevronRightIcon} from "@/shared/ui/icons";
import {SectionLabel} from "@/shared/ui/section-label";
import {SegmentedLinks} from "@/shared/ui/segmented-links";

const stepClass =
  "inline-flex min-h-11 items-center justify-center px-3 text-xs font-semibold uppercase tracking-[0.1em] text-ink transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function AdminBookingsViewToolbar({
  locale,
  query,
  today,
  labels,
}: {
  locale: AppLocale;
  query: AdminBookingQuery;
  today: string;
  labels: {
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
}) {
  const isDay = query.view === "day";
  const previousDate = addLocalDays(query.date, -1);
  const nextDate = addLocalDays(query.date, 1);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {isDay ? (
          <>
            <SectionLabel>{labels.timezone}</SectionLabel>
            <p className="mt-2 font-sans text-lg font-semibold leading-tight tabular-nums text-ink sm:text-xl">
              {formatWeekdayDate(query.date, locale)}
            </p>
            {query.date === today ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep">
                {labels.includesToday}
              </p>
            ) : null}
          </>
        ) : (
          <SectionLabel>{labels.view}</SectionLabel>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
              href: adminBookingListHref({...query, view: "day", date: isDay ? query.date : today, page: 1}),
              label: labels.day,
              current: isDay,
            },
          ]}
        />

        {isDay ? (
          <>
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
          </>
        ) : null}
      </div>
    </div>
  );
}
