import {todayInZurich} from "@/features/rooms/timezone";
import type {AppLocale} from "@/i18n/routing";
import {formatWeekdayDate} from "@/shared/format/calendar-date";

import type {ActivityEntry, ActivityWindow} from "./types";

export type ActivityGroup = {
  /** Zurich calendar day, or `today` when the window is the current day. */
  key: string;
  /**
   * Null when a heading would only repeat the window the reader already chose.
   * Upcoming and History name each Zurich day so the date is not on every row.
   */
  label: string | null;
  entries: ActivityEntry[];
};

/**
 * Groups a merged page the way a calendar list does: Today is one unnamed
 * block, later windows split on the Zurich day each row is about.
 */
export function groupActivityEntries(
  entries: ActivityEntry[],
  when: ActivityWindow,
  locale: AppLocale,
  today: string,
  todayLabel: string,
): ActivityGroup[] {
  if (entries.length === 0) {
    return [];
  }

  if (when === "today") {
    return [{key: "today", label: null, entries}];
  }

  const groups: ActivityGroup[] = [];

  for (const entry of entries) {
    const key = todayInZurich(entry.occursAt);
    const current = groups.at(-1);

    if (current?.key === key) {
      current.entries.push(entry);
      continue;
    }

    groups.push({
      key,
      label: key === today ? todayLabel : formatWeekdayDate(key, locale),
      entries: [entry],
    });
  }

  return groups;
}
