import {monthBounds, shiftLocalMonth} from "@/features/rooms/month-layout";
import {addLocalDays, formatLocalDate, mondayOf, parseLocalDate} from "@/features/rooms/timezone";

export function weekContaining(date: string): {startDate: string; endDate: string} {
  const startDate = mondayOf(date);
  return {startDate, endDate: addLocalDays(startDate, 6)};
}

export function dateInWeek(date: string, weekStart: string): boolean {
  const {startDate, endDate} = weekContaining(weekStart);
  return date >= startDate && date <= endDate;
}

/** First day of the month, used when jumping the month view. */
export function firstOfMonth(year: number, month: number): string {
  return formatLocalDate(year, month, 1);
}

export function pickerMonth(date: string): {year: number; month: number} {
  const {year, month} = parseLocalDate(date);
  return {year, month};
}

export function shiftPickerMonth(
  cursor: {year: number; month: number},
  delta: number,
): {year: number; month: number} {
  const next = shiftLocalMonth(firstOfMonth(cursor.year, cursor.month), delta);
  return pickerMonth(next);
}

export function pickerMonthBounds(cursor: {year: number; month: number}) {
  return monthBounds(firstOfMonth(cursor.year, cursor.month));
}
