import {
  addLocalDays,
  addZurichMonths,
  formatLocalDate,
  isoWeekday,
  parseLocalDate,
} from "@/features/rooms/timezone";

export type MonthBounds = {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
};

export function daysInLocalMonth(year: number, month: number): number {
  const probe = new Date(Date.UTC(year, month, 0));
  return probe.getUTCDate();
}

/** First and last calendar day of the month containing `date`. */
export function monthBounds(date: string): MonthBounds {
  const {year, month} = parseLocalDate(date);
  const startDate = formatLocalDate(year, month, 1);
  const endDate = addLocalDays(
    month === 12 ? formatLocalDate(year + 1, 1, 1) : formatLocalDate(year, month + 1, 1),
    -1,
  );
  return {year, month, startDate, endDate};
}

/** Monday-first weeks for a calendar month. Leading and trailing cells are null. */
export function monthWeeks(bounds: MonthBounds): Array<Array<string | null>> {
  const padding = isoWeekday(bounds.startDate) - 1;
  const cells: Array<string | null> = Array.from({length: padding}, () => null);

  for (let cursor = bounds.startDate; cursor <= bounds.endDate; cursor = addLocalDays(cursor, 1)) {
    cells.push(cursor);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: Array<Array<string | null>> = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

/** Move by whole months while keeping the day when possible. */
export function shiftLocalMonth(date: string, delta: number): string {
  const {year, month, day} = parseLocalDate(date);
  const shifted = addZurichMonths({year, month}, delta);
  const lastDay = daysInLocalMonth(shifted.year, shifted.month);
  return formatLocalDate(shifted.year, shifted.month, Math.min(day, lastDay));
}

export type MonthDayBooking = {
  id: string;
  roomId: string;
  roomName: string;
  localStart: string;
  localEnd: string;
  startsAt: string;
  amountMinor: number;
};

export function groupOwnBookingsByDate(input: {
  actorId: string;
  bookings: Array<{
    id: string;
    userId: string;
    roomId: string;
    startsAt: Date;
    endsAt: Date;
    amountMinor: number;
  }>;
  roomNames: Map<string, string>;
  utcToLocal: (instant: Date) => {date: string; time: string};
}): Record<string, MonthDayBooking[]> {
  const grouped = new Map<string, MonthDayBooking[]>();

  for (const booking of input.bookings) {
    if (booking.userId !== input.actorId) {
      continue;
    }

    const start = input.utcToLocal(booking.startsAt);
    const end = input.utcToLocal(booking.endsAt);
    const roomName = input.roomNames.get(booking.roomId) ?? "";

    for (let cursor = start.date; cursor <= end.date; cursor = addLocalDays(cursor, 1)) {
      const entry: MonthDayBooking = {
        id: booking.id,
        roomId: booking.roomId,
        roomName,
        localStart: cursor === start.date ? start.time : "00:00",
        localEnd:
          cursor === end.date ? (end.time === "00:00" ? "24:00" : end.time) : "24:00",
        startsAt: booking.startsAt.toISOString(),
        amountMinor: booking.amountMinor,
      };
      const list = grouped.get(cursor) ?? [];
      list.push(entry);
      grouped.set(cursor, list);
    }
  }

  const sorted: Record<string, MonthDayBooking[]> = {};
  for (const [date, entries] of grouped) {
    sorted[date] = [...entries].sort((left, right) =>
      left.localStart.localeCompare(right.localStart),
    );
  }

  return sorted;
}
