import type {AppLocale} from "@/i18n/routing";

import type {CourseDate} from "./types";

const ZURICH = "Europe/Zurich";

export function todayIsoInZurich(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZURICH,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isCourseDateBookable(
  date: CourseDate,
  now = new Date(),
): boolean {
  return date.active && date.startDate >= todayIsoInZurich(now);
}

export function formatDateRange(
  startDate: string,
  endDate: string | null | undefined,
  locale: AppLocale,
): string {
  const formatter = new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: ZURICH,
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const start = parseZurichDate(startDate);

  if (!endDate || endDate === startDate) {
    return formatter.format(start);
  }

  const end = parseZurichDate(endDate);

  // Same month and year reads better as "8 – 18 octobre 2026". Out-of-order
  // data keeps both full dates so the mistake stays visible.
  if (endDate.slice(0, 7) === startDate.slice(0, 7) && endDate > startDate) {
    const dayFormatter = new Intl.DateTimeFormat(intlLocale(locale), {
      timeZone: ZURICH,
      day: "numeric",
    });

    return `${dayFormatter.format(start)} – ${formatter.format(end)}`;
  }

  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export function formatCourseDateRange(
  date: CourseDate,
  locale: AppLocale,
): string {
  return formatDateRange(date.startDate, date.endDate, locale);
}

export type FormattedDateParts = {
  days: string;
  month: string;
  year: string;
  label: string;
};

const FIGURE_SPACE = "\u2007";

/**
 * Splits a range into day, month and year columns so stacked card dates can
 * share one grid: months start together, years start together.
 */
export function formatDateParts(
  startDate: string,
  endDate: string | null | undefined,
  locale: AppLocale,
): FormattedDateParts {
  const label = formatDateRange(startDate, endDate, locale);
  const intl = intlLocale(locale);
  const start = parseZurichDate(startDate);
  const lastIso = endDate && endDate !== startDate ? endDate : startDate;
  const end = parseZurichDate(lastIso);
  const dayFormatter = new Intl.DateTimeFormat(intl, {
    timeZone: ZURICH,
    day: "numeric",
  });
  const monthFormatter = new Intl.DateTimeFormat(intl, {
    timeZone: ZURICH,
    month: "long",
  });
  const startDay = padDay(dayFormatter.format(start));
  const endDay = padDay(dayFormatter.format(end));
  const startMonth = monthFormatter.format(start);
  const endMonth = monthFormatter.format(end);
  const startYear = startDate.slice(0, 4);
  const endYear = lastIso.slice(0, 4);

  if (!endDate || endDate === startDate) {
    return {days: startDay, month: startMonth, year: startYear, label};
  }

  if (endDate < startDate || startYear !== endYear) {
    return {days: label, month: "", year: "", label};
  }

  return {
    days: `${startDay} – ${endDay}`,
    month: startMonth === endMonth ? startMonth : `${startMonth} – ${endMonth}`,
    year: endYear,
    label,
  };
}

export function formatCourseDateParts(
  date: CourseDate,
  locale: AppLocale,
): FormattedDateParts {
  return formatDateParts(date.startDate, date.endDate, locale);
}

function padDay(day: string): string {
  const digits = day.replace(/\D/g, "");
  return digits.length === 1 ? `${FIGURE_SPACE}${day}` : day;
}

export function eachIsoDateInRange(
  startDate: string,
  endDate?: string,
): string[] {
  const last = endDate && endDate > startDate ? endDate : startDate;
  const days: string[] = [];
  let cursor = startDate;

  while (cursor <= last) {
    days.push(cursor);
    cursor = nextIsoDay(cursor);
  }

  return days;
}

export function courseOccupiesDate(date: CourseDate, isoDate: string): boolean {
  const last = date.endDate && date.endDate > date.startDate ? date.endDate : date.startDate;
  return isoDate >= date.startDate && isoDate <= last;
}

function nextIsoDay(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return next.toISOString().slice(0, 10);
}

export function toIsoDateTime(date: string): string {
  return `${date}T09:00:00+02:00`;
}

function parseZurichDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00+01:00`);
}

function intlLocale(locale: AppLocale): string {
  if (locale === "en") {
    return "en-GB";
  }

  if (locale === "de") {
    return "de-CH";
  }

  return "fr-CH";
}
