import type {
  CourseAvailability,
  CourseDate,
} from "./types";
import {courseAvailabilityOf, sessionAvailabilityOf} from "./types";

/** Paid and in-flight checkouts hold a seat; abandoned leads do not. */
export const OCCUPYING_BOOKING_STATUSES = ["PAID", "PENDING"] as const;

export type OccupancyByDate = Readonly<Record<string, number>>;

export type CourseScheduleStatus = "open" | "full" | "pending" | "closed";

export type PublicCourseAction = "book" | "waitlist" | "notify" | "closed";

export type SessionOffer = "open" | "full" | "pending" | "closed";

export type PublicSeatHint = "plenty" | 1 | 2 | "full";

type DatedSession = Pick<CourseDate, "id" | "capacity"> &
  Partial<Pick<CourseDate, "availability">>;

function normalizeCount(value: number | undefined): number {
  return Number.isFinite(value) && (value as number) > 0 ? Math.floor(value as number) : 0;
}

export function occupyingCount(occupancy: OccupancyByDate | undefined, dateId: string): number {
  return normalizeCount(occupancy?.[dateId]);
}

export function seatsLeft(capacity: number, enrolments: number): number {
  return Math.max(0, normalizeCount(capacity) - normalizeCount(enrolments));
}

export function seatsLeftForDate(
  date: Pick<CourseDate, "id" | "capacity">,
  occupancy: OccupancyByDate,
): number {
  return seatsLeft(date.capacity, occupyingCount(occupancy, date.id));
}

/**
 * Staff status wins for the public offer; remaining seats still close a date
 * that is marked available so a full room cannot be oversold.
 */
export function sessionOffer(
  date: DatedSession,
  occupancy: OccupancyByDate,
  courseAvailability: CourseAvailability = "auto",
): SessionOffer {
  const course = courseAvailabilityOf({availability: courseAvailability});
  if (course === "registration_closed") {
    return "closed";
  }
  if (course === "dates_pending") {
    return "pending";
  }
  if (course === "full") {
    return "full";
  }

  const session = sessionAvailabilityOf(date);
  if (session === "registration_closed") {
    return "closed";
  }
  if (session === "full") {
    return "full";
  }

  return seatsLeftForDate(date, occupancy) === 0 ? "full" : "open";
}

export function isSessionFull(
  date: DatedSession,
  occupancy: OccupancyByDate,
  courseAvailability: CourseAvailability = "auto",
): boolean {
  return sessionOffer(date, occupancy, courseAvailability) === "full";
}

/**
 * Remaining seats are a private number except when a session is about to sell
 * out. Three or more left keep the ordinary max-capacity line.
 */
export function publicSeatHint(remaining: number): PublicSeatHint {
  if (remaining <= 0) {
    return "full";
  }
  if (remaining === 1 || remaining === 2) {
    return remaining;
  }
  return "plenty";
}

export function datesWithOpenSeats<T extends DatedSession>(
  dates: readonly T[],
  occupancy: OccupancyByDate,
  courseAvailability: CourseAvailability = "auto",
): T[] {
  return dates.filter(
    (date) => sessionOffer(date, occupancy, courseAvailability) === "open",
  );
}

export function courseScheduleStatus(
  dates: readonly DatedSession[],
  occupancy: OccupancyByDate,
  courseAvailability: CourseAvailability = "auto",
): CourseScheduleStatus {
  const course = courseAvailabilityOf({availability: courseAvailability});
  if (course === "registration_closed") {
    return "closed";
  }
  if (course === "dates_pending") {
    return "pending";
  }
  if (course === "full") {
    return "full";
  }
  if (dates.length === 0) {
    return "pending";
  }
  if (datesWithOpenSeats(dates, occupancy, course).length > 0) {
    return "open";
  }
  if (dates.some((date) => sessionOffer(date, occupancy, course) === "full")) {
    return "full";
  }
  return "closed";
}

/** Status A books, B waitlists the session, C asks to be notified. Closed is not a form. */
export function publicCourseAction(status: CourseScheduleStatus): PublicCourseAction {
  if (status === "closed") {
    return "closed";
  }
  if (status === "pending") {
    return "notify";
  }
  if (status === "full") {
    return "waitlist";
  }
  return "book";
}

export function publicDateBookingQuery(
  offer: SessionOffer,
  dateId: string,
): {date?: string; waitlist?: string} | null {
  if (offer === "closed") {
    return null;
  }
  if (offer === "pending") {
    return {waitlist: "1"};
  }
  if (offer === "full") {
    return {date: dateId, waitlist: "1"};
  }
  return {date: dateId};
}

export function nearestDate<T extends Pick<CourseDate, "id" | "startDate">>(
  dates: readonly T[],
): T | undefined {
  return [...dates].sort((left, right) =>
    left.startDate === right.startDate
      ? left.id.localeCompare(right.id)
      : left.startDate.localeCompare(right.startDate),
  )[0];
}

export function nearestFullDate(
  dates: readonly CourseDate[],
  occupancy: OccupancyByDate,
  courseAvailability: CourseAvailability = "auto",
): CourseDate | undefined {
  return nearestDate(
    dates.filter((date) => isSessionFull(date, occupancy, courseAvailability)),
  );
}
