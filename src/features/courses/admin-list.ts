import type {CourseListQuery} from "@/features/courses/admin-query";
import {getBookableDates} from "@/features/courses/queries";
import {isCoursePublished, type Course, type CourseDate} from "@/features/courses/types";

/** One catalogue row with everything the admin list needs to render it. */
export type CourseListEntry = {
  course: Course;
  /** 1-based position in the unfiltered catalogue order. */
  position: number;
  published: boolean;
  sessionCount: number;
  enrolments: number;
  nextDate?: CourseDate;
};

export type CourseListSummary = {
  total: number;
  published: number;
  unpublished: number;
  withoutUpcoming: number;
  enrolments: number;
};

function earliestUpcoming(course: Course, now: Date): CourseDate | undefined {
  return [...getBookableDates(course, now)].sort((left, right) =>
    left.startDate.localeCompare(right.startDate),
  )[0];
}

export function buildCourseListEntries(
  catalogue: readonly Course[],
  enrolments: ReadonlyMap<string, number>,
  now = new Date(),
): CourseListEntry[] {
  return catalogue.map((course, index) => ({
    course,
    position: index + 1,
    published: isCoursePublished(course),
    sessionCount: course.dates.length,
    enrolments: enrolments.get(course.id) ?? 0,
    nextDate: earliestUpcoming(course, now),
  }));
}

export function summarizeCourseList(
  entries: readonly CourseListEntry[],
): CourseListSummary {
  return entries.reduce<CourseListSummary>(
    (summary, entry) => ({
      total: summary.total + 1,
      published: summary.published + (entry.published ? 1 : 0),
      unpublished: summary.unpublished + (entry.published ? 0 : 1),
      withoutUpcoming: summary.withoutUpcoming + (entry.nextDate ? 0 : 1),
      enrolments: summary.enrolments + entry.enrolments,
    }),
    {total: 0, published: 0, unpublished: 0, withoutUpcoming: 0, enrolments: 0},
  );
}

function matchesNeedle(course: Course, needle: string): boolean {
  if (!needle) {
    return true;
  }

  return [course.id, ...Object.values(course.title), ...Object.values(course.slug)]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export function filterCourseListEntries(
  entries: readonly CourseListEntry[],
  query: CourseListQuery,
): CourseListEntry[] {
  const needle = query.q.trim().toLowerCase();

  return entries.filter((entry) => {
    if (query.category !== "all" && entry.course.category !== query.category) {
      return false;
    }
    if (query.published === "yes" && !entry.published) {
      return false;
    }
    if (query.published === "no" && entry.published) {
      return false;
    }
    if (query.upcoming === "yes" && !entry.nextDate) {
      return false;
    }
    if (query.upcoming === "no" && entry.nextDate) {
      return false;
    }
    return matchesNeedle(entry.course, needle);
  });
}

/**
 * Reordering swaps neighbours in the full catalogue, so it is only offered on
 * the unfiltered list where the neighbour is the row the admin can see.
 */
export function isCourseListFiltered(query: CourseListQuery): boolean {
  return (
    query.q.trim() !== "" ||
    query.category !== "all" ||
    query.published !== "all" ||
    query.upcoming !== "all"
  );
}
