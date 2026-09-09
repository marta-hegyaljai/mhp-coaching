import {formatCourseDateParts} from "@/features/courses/dates";
import type {CourseDate} from "@/features/courses/types";
import type {AppLocale} from "@/i18n/routing";
import {CalendarIcon, PinIcon} from "@/shared/ui/icons";

export function CourseCardSchedule({
  dates,
  locale,
  location,
  awaitingDateLabel,
  hiddenDateCount,
  laterDatesLabel,
  laterDatesShort,
}: {
  dates: CourseDate[];
  locale: AppLocale;
  location: string;
  awaitingDateLabel?: string;
  hiddenDateCount: number;
  laterDatesLabel: string;
  laterDatesShort: string;
}) {
  if (dates.length === 0) {
    return (
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line-soft pt-4 text-sm text-ink-subtle">
        {awaitingDateLabel ? (
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            {awaitingDateLabel}
          </span>
        ) : null}
        <span className="flex items-center gap-1.5">
          <PinIcon className="h-3.5 w-3.5" />
          {location}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap items-start gap-x-5 gap-y-2 border-t border-line-soft pt-4 text-sm text-ink-subtle">
      <div className="grid grid-cols-[0.875rem_max-content_max-content_auto] items-center gap-x-1.5 gap-y-0.5">
        {dates.map((date, index) => {
          const parts = formatCourseDateParts(date, locale);
          const showOverflow =
            hiddenDateCount > 0 && index === dates.length - 1;

          return (
            <div key={date.id} className="contents">
              <span className="flex h-5 items-center justify-center">
                {index === 0 ? (
                  <CalendarIcon className="h-3.5 w-3.5" />
                ) : null}
                <span className="sr-only">
                  {showOverflow
                    ? `${parts.label}, ${laterDatesLabel}`
                    : parts.label}
                </span>
              </span>
              <span
                aria-hidden="true"
                data-date-part="days"
                className="text-right font-sans tabular-nums"
              >
                {parts.days}
              </span>
              <span aria-hidden="true" data-date-part="month">
                {parts.month}
              </span>
              <span
                aria-hidden="true"
                data-date-part="year"
                className="flex items-center gap-x-2 font-sans tabular-nums"
              >
                {parts.year}
                {showOverflow ? (
                  <span
                    title={laterDatesLabel}
                    className="rounded-panel border border-line px-1 py-px text-xs font-semibold tabular-nums text-ink"
                  >
                    {laterDatesShort}
                  </span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
      <span className="flex h-5 items-center gap-1.5">
        <PinIcon className="h-3.5 w-3.5" />
        {location}
      </span>
    </div>
  );
}
