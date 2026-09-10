import {todayIsoInZurich} from "@/features/courses/dates";

export function lastOccupiedDay(
  startDate: string,
  endDate: string | null | undefined,
): string {
  return endDate && endDate > startDate ? endDate : startDate;
}

export function isUpcomingRegistration(
  startDate: string,
  endDate: string | null | undefined,
  today = todayIsoInZurich(),
): boolean {
  return lastOccupiedDay(startDate, endDate) >= today;
}
