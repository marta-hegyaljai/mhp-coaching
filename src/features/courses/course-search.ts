import {getBookableDates} from "@/features/courses/queries";
import type {Course} from "@/features/courses/types";
import type {AppLocale} from "@/i18n/routing";

/** Whether a course title or summary matches the typed needle. */
export function courseMatchesQuery(
  course: Course,
  locale: AppLocale,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }

  return (
    course.title[locale].toLowerCase().includes(needle) ||
    course.shortDescription[locale].toLowerCase().includes(needle)
  );
}

/** Lower scores surface first: title prefix beats title substring beats summary. */
export function courseMatchRank(
  course: Course,
  locale: AppLocale,
  query: string,
): number {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return course.displayOrder ?? 0;
  }

  const title = course.title[locale].toLowerCase();
  if (title.startsWith(needle)) {
    return 0;
  }
  if (title.includes(needle)) {
    return 1;
  }

  return 2;
}

function occupiesMonth(
  startDate: string,
  endDate: string | undefined,
  month: string,
): boolean {
  const rangeStart = `${month}-01`;
  const rangeEnd = `${month}-31`;
  const last = endDate && endDate > startDate ? endDate : startDate;
  return startDate <= rangeEnd && last >= rangeStart;
}

/** Search suggestions honour the same month filter as the catalogue grid. */
export function filterCoursesForSearch(
  courses: readonly Course[],
  locale: AppLocale,
  query: string,
  month: string,
): Course[] {
  return courses
    .filter((course) => courseMatchesQuery(course, locale, query))
    .filter((course) => {
      if (!month) {
        return true;
      }

      return getBookableDates(course).some((date) =>
        occupiesMonth(date.startDate, date.endDate, month),
      );
    })
    .sort((left, right) => {
      const rankDelta =
        courseMatchRank(left, locale, query) - courseMatchRank(right, locale, query);
      if (rankDelta !== 0) {
        return rankDelta;
      }

      return left.title[locale].localeCompare(right.title[locale], locale);
    });
}
