import type {AppLocale} from "@/i18n/routing";
import {formatLongDate, formatWeekdayDate} from "@/shared/format/calendar-date";

import {utcToZurich} from "./timezone";

export type BookingWhen = {
  dateLabel: string;
  timeLabel: string;
};

/**
 * Bookings are stored as instants but read as Zurich wall-clock. Rendering
 * goes through here so no screen ever prints a raw `YYYY-MM-DD`.
 */
export function bookingWhen(
  startsAt: Date,
  endsAt: Date,
  locale: AppLocale,
  {weekday = true}: {weekday?: boolean} = {},
): BookingWhen {
  const start = utcToZurich(startsAt);
  const end = utcToZurich(endsAt);
  const dateLabel = weekday
    ? formatWeekdayDate(start.date, locale)
    : formatLongDate(start.date, locale);

  return {
    dateLabel,
    // Midnight closes the same day rather than opening the next one.
    timeLabel:
      start.date === end.date || end.time === "00:00"
        ? `${start.time}–${end.time === "00:00" ? "24:00" : end.time}`
        : `${start.time} – ${formatLongDate(end.date, locale)} ${end.time}`,
  };
}

/** "10 September 2026, 14:05" — timestamps in append-only history rows. */
export function bookingStamp(instant: Date, locale: AppLocale): string {
  const local = utcToZurich(instant);

  return `${formatLongDate(local.date, locale)}, ${local.time}`;
}

/** "10 September 2026 · 08:00–10:00" — one dense line for history payloads. */
export function bookingSpanLabel(startsAt: Date, endsAt: Date, locale: AppLocale): string {
  const when = bookingWhen(startsAt, endsAt, locale, {weekday: false});

  return `${when.dateLabel} · ${when.timeLabel}`;
}
