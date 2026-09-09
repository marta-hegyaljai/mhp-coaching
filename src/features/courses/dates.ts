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
