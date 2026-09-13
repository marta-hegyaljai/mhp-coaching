"use client";

import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {useTranslations} from "next-intl";

import type {TherapistMonthOverview} from "@/features/rooms/availability";
import type {MonthDayBooking} from "@/features/rooms/month-layout";
import type {AvailabilityQuery} from "@/features/rooms/query";
import {intlLocale} from "@/i18n/intl-locale";
import type {AppLocale} from "@/i18n/routing";
import {formatLongDate} from "@/shared/format/calendar-date";

import {MonthDayDialog} from "./month-day-dialog";

const CELL_HEIGHT = "h-[5.75rem] sm:h-28";

function weekdayHeaders(locale: AppLocale): string[] {
  return Array.from({length: 7}, (_, index) =>
    new Intl.DateTimeFormat(intlLocale(locale), {
      weekday: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2026, 0, 5 + index))),
  );
}

function formatBookingTime(start: string, end: string): string {
  return `${start}–${end === "00:00" ? "24:00" : end}`;
}

export function MonthCalendar({
  locale,
  query,
  overview,
  today,
  discountPercent,
}: {
  locale: AppLocale;
  query: AvailabilityQuery;
  overview: TherapistMonthOverview;
  today: string;
  discountPercent: number;
}) {
  const t = useTranslations("Rooms");
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dialogKey, setDialogKey] = useState(0);
  const weekdays = weekdayHeaders(locale);
  const monthLabel = new Intl.DateTimeFormat(intlLocale(locale), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(overview.year, overview.month - 1, 1)));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (selectedDate) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [selectedDate]);

  const selectedBookings = selectedDate
    ? overview.bookingsByDate[selectedDate] ?? []
    : [];

  return (
    <div className="rounded-panel border border-ink bg-white p-3 sm:p-5">
      <p className="max-w-2xl text-sm leading-6 text-ink-muted">{t("monthCalendarHelp")}</p>

      <div role="grid" aria-label={monthLabel} className="mt-4">
        <div role="row" className="grid grid-cols-7 border-b border-line-soft">
          {weekdays.map((label) => (
            <div
              key={label}
              role="columnheader"
              className="overflow-hidden px-0.5 pb-2 text-center text-[0.65rem] font-bold uppercase tracking-[0.08em] text-ink-muted"
            >
              <span className="block truncate">{label}</span>
            </div>
          ))}
        </div>

        {overview.weeks.map((week, weekIndex) => (
          <div key={weekIndex} role="row" className="grid grid-cols-7">
            {week.map((date, dayIndex) => (
              <MonthDayCell
                key={date ?? `empty-${weekIndex}-${dayIndex}`}
                date={date}
                today={today}
                bookings={date ? overview.bookingsByDate[date] ?? [] : []}
                selected={date === selectedDate}
                openLabel={date ? t("monthOpenDay", {date: formatLongDate(date, locale)}) : undefined}
                onOpen={setSelectedDate}
              />
            ))}
          </div>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto h-fit max-h-[calc(100dvh-2rem)] w-[min(28rem,calc(100%-1.5rem))] overflow-y-auto rounded-panel border border-ink bg-white p-0 text-ink backdrop:bg-ink/35"
        onClose={() => setSelectedDate(null)}
      >
        {selectedDate ? (
          <MonthDayDialog
            key={`${selectedDate}-${dialogKey}`}
            locale={locale}
            date={selectedDate}
            bookings={selectedBookings}
            roomIds={query.roomIds}
            discountPercent={discountPercent}
            cancellationNoticeHours={overview.cancellationNoticeHours}
            onClose={() => setSelectedDate(null)}
            onChanged={() => {
              router.refresh();
              setDialogKey((value) => value + 1);
            }}
          />
        ) : null}
      </dialog>
    </div>
  );
}

function MonthDayCell({
  date,
  today,
  bookings,
  selected,
  openLabel,
  onOpen,
}: {
  date: string | null;
  today: string;
  bookings: MonthDayBooking[];
  selected: boolean;
  openLabel?: string;
  onOpen: (date: string) => void;
}) {
  if (!date) {
    return <div role="gridcell" className={`${CELL_HEIGHT} border-b border-r border-line-soft last:border-r-0`} />;
  }

  const isToday = date === today;
  const visible = bookings.slice(0, 2);

  return (
    <div role="gridcell" className={`${CELL_HEIGHT} border-b border-r border-line-soft last:border-r-0`}>
      <button
        type="button"
        onClick={() => onOpen(date)}
        aria-label={openLabel}
        aria-current={isToday ? "date" : undefined}
        aria-pressed={selected}
        className={`flex h-full w-full flex-col overflow-hidden px-1 py-1 text-left transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink ${
          selected
            ? "bg-ink text-parchment"
            : bookings.length > 0
              ? "bg-shell text-ink hover:bg-hover"
              : "bg-white text-ink hover:bg-hover"
        }`}
      >
        <span className="flex items-center justify-between gap-1">
          <span
            className={`text-sm tabular-nums ${
              isToday ? "font-semibold underline decoration-2 underline-offset-2" : "font-medium"
            }`}
          >
            {Number(date.slice(8, 10))}
          </span>
          {bookings.length > 0 ? (
            <span className="text-[0.65rem] font-semibold tabular-nums">{bookings.length}</span>
          ) : null}
        </span>
        <span className="mt-1 min-h-0 flex-1 space-y-0.5 overflow-hidden">
          {visible.map((booking) => (
            <span
              key={`${booking.id}-${booking.localStart}`}
              className={`block truncate font-sans text-[0.62rem] leading-4 tabular-nums ${
                selected ? "text-parchment" : "text-ink"
              }`}
            >
              {formatBookingTime(booking.localStart, booking.localEnd)}
            </span>
          ))}
        </span>
      </button>
    </div>
  );
}
