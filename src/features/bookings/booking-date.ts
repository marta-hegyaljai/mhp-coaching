import {getBookableDates} from "@/features/courses/queries";
import type {Course, LocalizedText} from "@/features/courses/types";

export const DATE_TO_BE_CONFIRMED = "DATE_TO_BE_CONFIRMED";

export type BookingDateSnapshot = {
  id: string;
  startDate: string;
  endDate?: string;
  location: LocalizedText;
};

export function unscheduledCourseDateId(courseId: string): string {
  return `${courseId}-date-to-be-confirmed`;
}

export function resolveBookingDate(
  course: Course,
  courseDateId: string,
  now = new Date(),
): BookingDateSnapshot | undefined {
  const publishedDate = getBookableDates(course, now).find(
    (date) => date.id === courseDateId,
  );

  if (publishedDate) {
    return publishedDate;
  }

  if (
    course.dates.length === 0 &&
    courseDateId === unscheduledCourseDateId(course.id)
  ) {
    return {
      id: courseDateId,
      startDate: DATE_TO_BE_CONFIRMED,
      location: course.location,
    };
  }

  return undefined;
}

export function isDateToBeConfirmed(value: string): boolean {
  return value === DATE_TO_BE_CONFIRMED;
}
