import {todayInZurich, zurichDayRange} from "@/features/rooms/timezone";

import type {ActivityEntry, ActivityWindow} from "./types";

export type ActivityBounds = {
  when: ActivityWindow;
  now: Date;
  /** Zurich calendar day, `YYYY-MM-DD`. */
  today: string;
  dayStart: Date;
  dayEndExclusive: Date;
};

export function activityBounds(when: ActivityWindow, now = new Date()): ActivityBounds {
  const today = todayInZurich(now);
  const day = zurichDayRange(today);

  return {
    when,
    now,
    today,
    dayStart: day.start,
    dayEndExclusive: day.endExclusive,
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
