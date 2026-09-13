"use client";

import {useEffect, useRef, useState, useTransition} from "react";
import {useTranslations} from "next-intl";

import {monthWeeks} from "@/features/rooms/month-layout";
import {availabilityHref, type AvailabilityQuery} from "@/features/rooms/query";
import {intlLocale} from "@/i18n/intl-locale";
import {useRouter} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {
  formatDayRange,
  formatLongDate,
  formatMonthYear,
} from "@/shared/format/calendar-date";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SpinnerIcon,
} from "@/shared/ui/icons";

import {
  dateInWeek,
  firstOfMonth,
  pickerMonth,
  pickerMonthBounds,
  shiftPickerMonth,
  weekContaining,
} from "./period-range";

const cellClass =
  "flex h-9 w-full items-center justify-center font-sans text-sm tabular-nums transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink";

function weekdayHeaders(locale: AppLocale): string[] {
  return Array.from({length: 7}, (_, index) =>
    new Intl.DateTimeFormat(intlLocale(locale), {
      weekday: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2026, 0, 5 + index))),
  );
}

function monthNames(locale: AppLocale, year: number): string[] {
  return Array.from({length: 12}, (_, index) =>
    new Intl.DateTimeFormat(intlLocale(locale), {
      month: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, index, 1))),
  );
}

function triggerLabel(query: AvailabilityQuery, locale: AppLocale): string {
  if (query.view === "month") {
    return formatMonthYear(query.date, locale);
  }
  if (query.view === "week") {
    const week = weekContaining(query.date);
    return formatDayRange(week.startDate, week.endDate, locale);
  }
  return formatLongDate(query.date, locale);
}

export function PeriodJump({
  locale,
  query,
  today,
}: {
  locale: AppLocale;
  query: AvailabilityQuery;
  today: string;
}) {
  const t = useTranslations("Rooms");
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const selected = pickerMonth(query.date);
  const [cursor, setCursor] = useState(selected);

  const jumpLabel =
    query.view === "month"
      ? t("jumpToMonth")
      : query.view === "week"
        ? t("jumpToWeek")
        : t("jumpToDate");

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function jump(date: string) {
    setOpen(false);
    if (date === query.date) {
      return;
    }
    startTransition(() => {
      router.push(availabilityHref({...query, date}), {scroll: false});
    });
  }

  function toggle() {
    setCursor(pickerMonth(query.date));
    setOpen((value) => !value);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={jumpLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={pending}
        onClick={toggle}
        className="inline-flex min-h-11 min-w-[12.5rem] items-center gap-2 rounded-panel border border-ink bg-white px-3 text-left text-ink transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-progress"
      >
        {pending ? <SpinnerIcon /> : <CalendarIcon />}
        <span className="min-w-0 flex-1 truncate font-sans text-sm font-semibold tabular-nums capitalize">
          {triggerLabel(query, locale)}
        </span>
        <ChevronDownIcon />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={jumpLabel}
          className="absolute left-0 z-40 mt-2 w-[18.75rem] max-w-[calc(100vw-2rem)] rounded-panel border border-ink bg-white p-3 text-ink sm:left-auto sm:right-0"
        >
          {query.view === "month" ? (
            <MonthPanel
              locale={locale}
              year={cursor.year}
              selected={selected}
              onYear={(delta) => setCursor((current) => ({...current, year: current.year + delta}))}
              onSelect={(year, month) => jump(firstOfMonth(year, month))}
              previousYear={t("previousYear")}
              nextYear={t("nextYear")}
            />
          ) : (
            <CalendarPanel
              locale={locale}
              cursor={cursor}
              query={query}
              today={today}
              onShift={(delta) => setCursor((current) => shiftPickerMonth(current, delta))}
              onSelect={jump}
              previousMonth={t("previousMonth")}
              nextMonth={t("nextMonth")}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

function CalendarPanel({
  locale,
  cursor,
  query,
  today,
  onShift,
  onSelect,
  previousMonth,
  nextMonth,
}: {
  locale: AppLocale;
  cursor: {year: number; month: number};
  query: AvailabilityQuery;
  today: string;
  onShift: (delta: number) => void;
  onSelect: (date: string) => void;
  previousMonth: string;
  nextMonth: string;
}) {
  const bounds = pickerMonthBounds(cursor);
  const weeks = monthWeeks(bounds);
  const weekdays = weekdayHeaders(locale);
  const heading = formatMonthYear(bounds.startDate, locale);
  const isWeek = query.view === "week";

  return (
    <div>
      <PickerChrome
        label={heading}
        previousLabel={previousMonth}
        nextLabel={nextMonth}
        onPrevious={() => onShift(-1)}
        onNext={() => onShift(1)}
      />
      <div className="mt-3 grid grid-cols-7">
        {weekdays.map((label) => (
          <div
            key={label}
            className="pb-1 text-center text-[0.62rem] font-bold uppercase tracking-[0.08em] text-ink-muted"
          >
            <span className="block truncate">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 space-y-0.5">
        {weeks.map((week) => {
          const weekDate = week.find((date) => date !== null);
          const weekSelected =
            isWeek && week.some((date) => date !== null && dateInWeek(date, query.date));

          if (isWeek) {
            return (
              <button
                key={week[0] ?? week[6] ?? heading}
                type="button"
                disabled={!weekDate}
                onClick={() => weekDate && onSelect(weekDate)}
                className={`grid w-full grid-cols-7 rounded-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                  weekSelected ? "bg-ink text-parchment" : "hover:bg-hover"
                }`}
              >
                {week.map((date, index) => (
                  <span
                    key={date ?? `empty-${index}`}
                    className={`${cellClass} ${
                      date === today && !weekSelected ? "font-semibold underline decoration-2 underline-offset-2" : ""
                    } ${date ? "" : "opacity-0"}`}
                  >
                    {date ? Number(date.slice(8, 10)) : "·"}
                  </span>
                ))}
              </button>
            );
          }

          return (
            <div key={week[0] ?? week[6] ?? heading} className="grid grid-cols-7">
              {week.map((date, index) =>
                date ? (
                  <button
                    key={date}
                    type="button"
                    onClick={() => onSelect(date)}
                    className={`${cellClass} rounded-panel ${
                      date === query.date
                        ? "bg-ink text-parchment"
                        : date === today
                          ? "font-semibold underline decoration-2 underline-offset-2 hover:bg-hover"
                          : "hover:bg-hover"
                    }`}
                  >
                    {Number(date.slice(8, 10))}
                  </button>
                ) : (
                  <span key={`empty-${index}`} className={cellClass} />
                ),
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthPanel({
  locale,
  year,
  selected,
  onYear,
  onSelect,
  previousYear,
  nextYear,
}: {
  locale: AppLocale;
  year: number;
  selected: {year: number; month: number};
  onYear: (delta: number) => void;
  onSelect: (year: number, month: number) => void;
  previousYear: string;
  nextYear: string;
}) {
  const names = monthNames(locale, year);

  return (
    <div>
      <PickerChrome
        label={String(year)}
        previousLabel={previousYear}
        nextLabel={nextYear}
        onPrevious={() => onYear(-1)}
        onNext={() => onYear(1)}
      />
      <div className="mt-3 grid grid-cols-3 gap-1">
        {names.map((name, index) => {
          const month = index + 1;
          const current = selected.year === year && selected.month === month;
          return (
            <button
              key={month}
              type="button"
              onClick={() => onSelect(year, month)}
              className={`min-h-11 rounded-panel px-2 text-sm font-semibold capitalize transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                current ? "bg-ink text-parchment" : "hover:bg-hover"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PickerChrome({
  label,
  previousLabel,
  nextLabel,
  onPrevious,
  onNext,
}: {
  label: string;
  previousLabel: string;
  nextLabel: string;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const chromeClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-panel text-ink transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

  return (
    <div className="flex items-center justify-between gap-2">
      <button type="button" aria-label={previousLabel} onClick={onPrevious} className={chromeClass}>
        <ChevronLeftIcon />
      </button>
      <p className="min-w-0 text-center font-sans text-sm font-semibold capitalize tabular-nums">
        {label}
      </p>
      <button type="button" aria-label={nextLabel} onClick={onNext} className={chromeClass}>
        <ChevronRightIcon />
      </button>
    </div>
  );
}
