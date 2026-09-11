import {intlLocale} from "@/i18n/intl-locale";
import type {AppLocale} from "@/i18n/routing";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Calendar dates are wall-clock days, not instants. Reading them as UTC keeps
 * the rendered day identical to the stored `YYYY-MM-DD` in every timezone.
 */
function utcDay(isoDate: string): Date | null {
  if (!ISO_DATE.test(isoDate)) {
    return null;
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  const instant = new Date(Date.UTC(year, month - 1, day));

  if (
    instant.getUTCFullYear() !== year ||
    instant.getUTCMonth() !== month - 1 ||
    instant.getUTCDate() !== day
  ) {
    return null;
  }

  return instant;
}

function format(
  isoDate: string,
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions,
): string {
  const instant = utcDay(isoDate);

  if (!instant) {
    return isoDate;
  }

  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: "UTC",
    ...options,
  }).format(instant);
}

/** "20 mars 2026" — used for issue dates and single-day headings. */
export function formatLongDate(isoDate: string, locale: AppLocale): string {
  return format(isoDate, locale, {day: "numeric", month: "long", year: "numeric"});
}

/** "jeudi 10 septembre 2026" — the day view needs the weekday for orientation. */
export function formatWeekdayDate(isoDate: string, locale: AppLocale): string {
  return format(isoDate, locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export type DayHeading = {
  weekday: string;
  day: string;
};

/** Compact column heading: short weekday above the day number. */
export function formatDayHeading(isoDate: string, locale: AppLocale): DayHeading {
  return {
    weekday: format(isoDate, locale, {weekday: "short"}),
    day: format(isoDate, locale, {day: "numeric"}),
  };
}

/**
 * "7 – 13 septembre 2026", collapsing the parts both ends share so the range
 * stays readable instead of repeating the month and year twice.
 */
export function formatDayRange(
  startIso: string,
  endIso: string,
  locale: AppLocale,
): string {
  if (startIso === endIso || !utcDay(startIso) || !utcDay(endIso)) {
    return formatLongDate(startIso, locale);
  }

  const end = formatLongDate(endIso, locale);
  const sameYear = startIso.slice(0, 4) === endIso.slice(0, 4);
  const sameMonth = sameYear && startIso.slice(0, 7) === endIso.slice(0, 7);

  if (sameMonth) {
    return `${format(startIso, locale, {day: "numeric"})} – ${end}`;
  }

  if (sameYear) {
    return `${format(startIso, locale, {day: "numeric", month: "long"})} – ${end}`;
  }

  return `${formatLongDate(startIso, locale)} – ${end}`;
}
