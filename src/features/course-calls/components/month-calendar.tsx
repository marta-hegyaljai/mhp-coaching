"use client";

import {useMemo} from "react";
import {useLocale, useTranslations} from "next-intl";

import {formatMonthYear, formatWeekdayDate} from "@/shared/format/calendar-date";
import {intlLocale} from "@/i18n/intl-locale";
import type {AppLocale} from "@/i18n/routing";
import {
  isIsoInRange,
  monthWeeks,
  shiftMonth,
  todayIsoInZurich,
  toIsoDate,
} from "@/shared/ui/date-field-calendar";
import {ChevronLeftIcon, ChevronRightIcon} from "@/shared/ui/icons";

export function MonthCalendar({
  selected,
  availableDates,
  min,
  max,
  onSelect,
  onMonthChange,
  cursor,
}: {
  selected: string;
  availableDates: ReadonlySet<string>;
  min: string;
  max: string;
  cursor: {year: number; month: number};
  onSelect: (iso: string) => void;
  onMonthChange: (cursor: {year: number; month: number}) => void;
}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("DateField");
  const today = todayIsoInZurich();
  const weeks = useMemo(
    () => monthWeeks(cursor.year, cursor.month),
    [cursor.month, cursor.year],
  );
  const weekdays = useMemo(() => weekdayHeadings(locale), [locale]);
  const monthLabel = formatMonthYear(toIsoDate(cursor.year, cursor.month, 1), locale);

  return (
    <div className="rounded-panel border border-ink bg-white p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(cursor.year, cursor.month, -1))}
          aria-label={t("previousMonth")}
          className="flex size-11 items-center justify-center rounded-panel border border-line text-ink transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <ChevronLeftIcon />
        </button>
        <p className="min-w-0 text-center text-sm font-semibold capitalize">{monthLabel}</p>
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(cursor.year, cursor.month, 1))}
          aria-label={t("nextMonth")}
          className="flex size-11 items-center justify-center rounded-panel border border-line text-ink transition-colors duration-150 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7">
        {weekdays.map((weekday, index) => (
          <p
            key={index}
            className="flex h-8 items-center justify-center text-[0.65rem] font-bold uppercase tracking-[0.08em] text-ink-subtle"
          >
            {weekday}
          </p>
        ))}
        {weeks.flat().map((iso, index) => {
          if (!iso) {
            return <span key={`empty-${index}`} aria-hidden="true" className="min-h-11" />;
          }

          const inRange = isIsoInRange(iso, min, max);
          const hasSlots = availableDates.has(iso);
          const enabled = inRange && hasSlots;
          const isSelected = iso === selected;
          const isToday = iso === today;

          return (
            <button
              key={iso}
              type="button"
              disabled={!enabled}
              aria-label={formatWeekdayDate(iso, locale)}
              aria-pressed={isSelected}
              onClick={() => onSelect(iso)}
              className={`flex min-h-11 items-center justify-center rounded-panel font-sans text-sm tabular-nums transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-35 ${
                isSelected
                  ? "bg-ink text-parchment"
                  : isToday
                    ? "border border-ink hover:bg-hover"
                    : "hover:bg-hover"
              }`}
            >
              {Number(iso.slice(8, 10))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function weekdayHeadings(locale: AppLocale): string[] {
  const formatter = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: "narrow",
    timeZone: "UTC",
  });

  return Array.from({length: 7}, (_, index) => {
    return formatter.format(new Date(Date.UTC(2026, 0, 5 + index)));
  });
}
