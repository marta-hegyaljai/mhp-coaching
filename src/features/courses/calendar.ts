import {formatCataloguePrice} from "@/features/courses/price";
import type {AppLocale} from "@/i18n/routing";

import {getBookableDates, getPublishedCourses} from "./queries";
import {courseOccupiesDate, formatCourseDateRange} from "./dates";
import type {Course, CourseDate} from "./types";

export type CalendarSession = {
  courseId: string;
  slug: string;
  title: string;
  duration: string;
  priceLabel: string;
  dateId: string;
  startDate: string;
  endDate?: string;
  dateLabel: string;
  location: string;
};

export function getPublishedCalendarSessions(
  locale: AppLocale,
  now = new Date(),
): CalendarSession[] {
  return getPublishedCourses().flatMap((course) =>
    getBookableDates(course, now).map((date) =>
      toCalendarSession(course, date, locale),
    ),
  );
}

export function toCalendarSession(
  course: Course,
  date: CourseDate,
  locale: AppLocale,
): CalendarSession {
  return {
    courseId: course.id,
    slug: course.slug[locale],
    title: course.title[locale],
    duration: course.duration[locale],
    priceLabel: formatCataloguePrice(course.priceChf, locale),
    dateId: date.id,
    startDate: date.startDate,
    endDate: date.endDate,
    dateLabel: formatCourseDateRange(date, locale),
    location: date.location[locale],
  };
}

export function sessionsOnDate(
  sessions: CalendarSession[],
  isoDate: string,
): CalendarSession[] {
  return sessions.filter((session) =>
    courseOccupiesDate(
      {
        id: session.dateId,
        startDate: session.startDate,
        endDate: session.endDate,
        location: {fr: session.location, de: session.location, en: session.location},
        capacity: 16,
        active: true,
      },
      isoDate,
    ),
  );
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}
