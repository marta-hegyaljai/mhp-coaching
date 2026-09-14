import type {AppLocale} from "@/i18n/routing";
import {formatLongDate, formatWeekdayDate} from "@/shared/format/calendar-date";
import {utcToZurich} from "@/features/rooms/timezone";

export function callWhen(
  startsAt: Date,
  endsAt: Date,
  locale: AppLocale,
): {dateLabel: string; timeLabel: string; weekdayDate: string} {
  const start = utcToZurich(startsAt);
  const end = utcToZurich(endsAt);
  return {
    dateLabel: formatLongDate(start.date, locale),
    weekdayDate: formatWeekdayDate(start.date, locale),
    timeLabel: `${start.time}–${end.time}`,
  };
}

export function callPersonName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}
