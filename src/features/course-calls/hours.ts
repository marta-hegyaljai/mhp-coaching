import {CourseCallError} from "./errors";
import {CALL_DURATION_MINUTES} from "./constants";

export type CallHourInput = {
  weekday: number;
  closed: boolean;
  intervals: Array<{startMinute: number; endMinute: number}>;
};

export type CallHourInterval = {
  weekday: number;
  startMinute: number;
  endMinute: number;
};

export function normalizeCallHours(hours: CallHourInput[]): CallHourInterval[] {
  if (hours.length !== 7) {
    throw new CourseCallError("invalidHours");
  }

  const seen = new Set<number>();
  const intervals: CallHourInterval[] = [];

  for (const hour of hours) {
    if (!Number.isInteger(hour.weekday) || hour.weekday < 1 || hour.weekday > 7) {
      throw new CourseCallError("invalidHours");
    }
    if (seen.has(hour.weekday)) {
      throw new CourseCallError("invalidHours");
    }
    seen.add(hour.weekday);
    if (hour.closed) {
      continue;
    }
    const merged = mergeIntervals(hour.intervals);
    for (const interval of merged) {
      intervals.push({
        weekday: hour.weekday,
        startMinute: interval.startMinute,
        endMinute: interval.endMinute,
      });
    }
  }

  return intervals;
}

function mergeIntervals(
  intervals: Array<{startMinute: number; endMinute: number}>,
): Array<{startMinute: number; endMinute: number}> {
  if (intervals.length === 0) {
    throw new CourseCallError("invalidHours");
  }

  const sorted = [...intervals].sort((a, b) => a.startMinute - b.startMinute);
  const merged: Array<{startMinute: number; endMinute: number}> = [];

  for (const interval of sorted) {
    assertAlignedInterval(interval);
    const last = merged[merged.length - 1];
    if (last && interval.startMinute <= last.endMinute) {
      last.endMinute = Math.max(last.endMinute, interval.endMinute);
      continue;
    }
    merged.push({...interval});
  }

  return merged;
}

function assertAlignedInterval(interval: {startMinute: number; endMinute: number}): void {
  if (
    !Number.isInteger(interval.startMinute) ||
    !Number.isInteger(interval.endMinute) ||
    interval.startMinute < 0 ||
    interval.endMinute > 1440 ||
    interval.endMinute <= interval.startMinute ||
    interval.startMinute % CALL_DURATION_MINUTES !== 0 ||
    interval.endMinute % CALL_DURATION_MINUTES !== 0
  ) {
    throw new CourseCallError("invalidHours");
  }
}
