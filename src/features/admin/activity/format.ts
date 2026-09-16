import {utcToZurich} from "@/features/rooms/timezone";
import type {AppLocale} from "@/i18n/routing";
import {formatLongDate} from "@/shared/format/calendar-date";

/**
 * Rows that only ever arrive (messages, waiting-list joins, recorded changes)
 * still need a Zurich-local date and clock time to sit on the timeline.
 */
export function arrivalWhen(
  instant: Date,
  locale: AppLocale,
): {dateLabel: string; timeLabel: string} {
  const local = utcToZurich(instant);

  return {dateLabel: formatLongDate(local.date, locale), timeLabel: local.time};
}

/** Keeps a free-text excerpt to one readable line inside a dense row. */
export function excerpt(value: string, maxLength = 140): string {
  const collapsed = value.replaceAll(/\s+/g, " ").trim();

  return collapsed.length > maxLength
    ? `${collapsed.slice(0, maxLength - 1).trimEnd()}…`
    : collapsed;
}
