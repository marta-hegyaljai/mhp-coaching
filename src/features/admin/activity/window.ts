import {todayInZurich, zurichDayRange} from "@/features/rooms/timezone";
import {isIsoDate} from "@/shared/ui/date-field-calendar";

import type {ActivityEntry, ActivityWindow} from "./types";

export type ActivityBounds = {
  when: ActivityWindow;
  now: Date;
  /** Zurich calendar day this window is ordered against, `YYYY-MM-DD`. */
  today: string;
  dayStart: Date;
  dayEndExclusive: Date;
};

export function activityBounds(
  when: ActivityWindow,
  now = new Date(),
  day?: string | null,
): ActivityBounds {
  const calendarToday = todayInZurich(now);
  const focusDay =
    when === "today" && day && isIsoDate(day) ? day : calendarToday;
  const range = zurichDayRange(focusDay);

  return {
    when,
    now,
    today: focusDay,
    dayStart: range.start,
    dayEndExclusive: range.endExclusive,
  };
}

/**
 * Every window orders on `occursAt`, the moment the row is labelled with, so
 * the dates a reader sees always run in the direction they are reading.
 * History runs backwards from now; Today and Upcoming read forwards. `id`
 * closes the order so paging through a merged feed can never repeat or skip a
 * row — each source must sort its own rows the same way.
 */
export function compareActivityEntries(
  when: ActivityWindow,
): (left: ActivityEntry, right: ActivityEntry) => number {
  if (when === "history") {
    return (left, right) =>
      right.occursAt.getTime() - left.occursAt.getTime() ||
      right.receivedAt.getTime() - left.receivedAt.getTime() ||
      left.id.localeCompare(right.id);
  }

  return (left, right) =>
    left.occursAt.getTime() - right.occursAt.getTime() ||
    left.receivedAt.getTime() - right.receivedAt.getTime() ||
    left.id.localeCompare(right.id);
}
