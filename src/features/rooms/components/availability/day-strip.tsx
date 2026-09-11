import {availabilityHref, type AvailabilityQuery} from "@/features/rooms/query";
import {Link} from "@/i18n/navigation";
import {formatDayHeading} from "@/shared/format/calendar-date";
import type {AppLocale} from "@/i18n/routing";

/**
 * Phone week navigation: one row of days that keeps the week context while a
 * single day stays legible, instead of shrinking a seven-column grid.
 */
export function DayStrip({
  locale,
  query,
  days,
  selectedDate,
  today,
  todayLabel,
}: {
  locale: AppLocale;
  query: AvailabilityQuery;
  days: string[];
  selectedDate: string;
  today: string;
  todayLabel: string;
}) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {days.map((date) => {
        const selected = date === selectedDate;
        const heading = formatDayHeading(date, locale);

        return (
          <Link
            key={date}
            href={availabilityHref({...query, date})}
            aria-current={selected ? "date" : undefined}
            className={`flex min-h-14 min-w-14 shrink-0 flex-col items-center justify-center rounded-panel border px-2 transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
              selected
                ? "border-ink bg-ink text-parchment"
                : "border-ink bg-white text-ink hover:bg-hover"
            }`}
          >
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em]">
              {heading.weekday}
            </span>
            <span className="font-sans text-base font-semibold tabular-nums leading-tight">
              {heading.day}
            </span>
            {date === today ? (
              <span className="sr-only">{todayLabel}</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
