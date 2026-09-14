import {
  addLocalDays,
  isoWeekday,
  minutesToTime,
  todayInZurich,
  utcToZurich,
  zurichDayRange,
  zurichLocalToUtc,
} from "@/features/rooms/timezone";

import {
  CALL_DURATION_MINUTES,
  CALL_MAX_ADVANCE_DAYS,
  CALL_MIN_NOTICE_MINUTES,
} from "./constants";
import type {CallHourInterval} from "./hours";
import {listCallHours, listScheduledCallsBetween} from "./repository";

export type AvailableCallSlot = {
  date: string;
  time: string;
  startsAt: Date;
  endsAt: Date;
};

export type CallWindow = {
  minDate: string;
  maxDate: string;
  earliestStart: Date;
};

export function callBookingWindow(now = new Date()): CallWindow {
  const minDate = todayInZurich(now);
  const maxDate = addLocalDays(minDate, CALL_MAX_ADVANCE_DAYS);
  return {
    minDate,
    maxDate,
    earliestStart: new Date(now.getTime() + CALL_MIN_NOTICE_MINUTES * 60_000),
  };
}

export async function loadCallAvailability(now = new Date()): Promise<{
  hours: CallHourInterval[];
  window: CallWindow;
  booked: AvailableCallSlot[];
}> {
  const window = callBookingWindow(now);
  const hours = await listCallHours();
  const rangeStart = zurichDayRange(window.minDate).start;
  const rangeEnd = zurichDayRange(addLocalDays(window.maxDate, 1)).endExclusive;
  const bookedRows = await listScheduledCallsBetween(rangeStart, rangeEnd);
  return {
    hours,
    window,
    booked: bookedRows.map((row) => {
      const local = utcToZurich(row.startsAt);
      return {
        date: local.date,
        time: local.time,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
      };
    }),
  };
}

export function slotsForDate(
  date: string,
  hours: CallHourInterval[],
  booked: AvailableCallSlot[],
  window: CallWindow,
): AvailableCallSlot[] {
  if (date < window.minDate || date > window.maxDate) {
    return [];
  }

  const weekday = isoWeekday(date);
  const dayHours = hours.filter((hour) => hour.weekday === weekday);
  const slots: AvailableCallSlot[] = [];

  for (const hour of dayHours) {
    for (
      let minute = hour.startMinute;
      minute + CALL_DURATION_MINUTES <= hour.endMinute;
      minute += CALL_DURATION_MINUTES
    ) {
      const time = minutesToTime(minute);
      const start = zurichLocalToUtc(date, time);
      if (!start.ok) {
        continue;
      }
      const end = zurichLocalToUtc(date, minutesToTime(minute + CALL_DURATION_MINUTES));
      if (!end.ok) {
        continue;
      }
      if (start.instant < window.earliestStart) {
        continue;
      }
      if (isTaken(start.instant, end.instant, booked)) {
        continue;
      }
      slots.push({
        date,
        time,
        startsAt: start.instant,
        endsAt: end.instant,
      });
    }
  }

  return slots;
}

export function datesWithSlots(
  hours: CallHourInterval[],
  booked: AvailableCallSlot[],
  window: CallWindow,
): string[] {
  const dates: string[] = [];
  let cursor = window.minDate;
  while (cursor <= window.maxDate) {
    if (slotsForDate(cursor, hours, booked, window).length > 0) {
      dates.push(cursor);
    }
    cursor = addLocalDays(cursor, 1);
  }
  return dates;
}

export function findSlot(
  date: string,
  time: string,
  hours: CallHourInterval[],
  booked: AvailableCallSlot[],
  window: CallWindow,
): AvailableCallSlot | undefined {
  return slotsForDate(date, hours, booked, window).find((slot) => slot.time === time);
}

function isTaken(start: Date, end: Date, booked: AvailableCallSlot[]): boolean {
  return booked.some((slot) => start < slot.endsAt && slot.startsAt < end);
}
