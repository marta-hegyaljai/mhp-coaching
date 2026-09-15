import type {BookingStatus} from "@/db/schema";
import {
  COURSE_CATEGORIES,
  isCourseCategory,
  type CourseCategory,
} from "@/features/courses/types";
import type {PathnameHref} from "@/i18n/href";

const CATEGORIES: Array<CourseCategory | "all"> = ["all", ...COURSE_CATEGORIES];
const PUBLISHED = ["all", "yes", "no"] as const;
/** Whether a course still has a bookable session ahead of today. */
const UPCOMING = ["all", "yes", "no"] as const;
const STATUSES: Array<BookingStatus | "all"> = [
  "all",
  "PAID",
  "PENDING",
  "LEAD",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
];

export type CourseListQuery = {
  q: string;
  category: (typeof CATEGORIES)[number];
  published: (typeof PUBLISHED)[number];
  upcoming: (typeof UPCOMING)[number];
};

export type CourseEnrolmentQuery = {
  q: string;
  session: string;
  status: (typeof STATUSES)[number];
};

export const COURSE_RECORD_TABS = [
  "details",
  "sessions",
  "enrolments",
  "waitlist",
] as const;
export const COURSE_SESSION_SHOWS = ["all", "upcoming", "inactive", "past"] as const;

export type CourseRecordTab = (typeof COURSE_RECORD_TABS)[number];
export type CourseSessionShow = (typeof COURSE_SESSION_SHOWS)[number];

export type CourseRecordQuery = CourseEnrolmentQuery & {
  tab: CourseRecordTab;
  show: CourseSessionShow;
};

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function parseCourseListQuery(searchParams: {
  q?: string | string[];
  category?: string | string[];
  published?: string | string[];
  upcoming?: string | string[];
}): CourseListQuery {
  const category = firstString(searchParams.category);
  const published = firstString(searchParams.published);
  const upcoming = firstString(searchParams.upcoming);
  return {
    q: firstString(searchParams.q).trim(),
    category: isCourseCategory(category) ? category : "all",
    published: PUBLISHED.includes(published as CourseListQuery["published"])
      ? (published as CourseListQuery["published"])
      : "all",
    upcoming: UPCOMING.includes(upcoming as CourseListQuery["upcoming"])
      ? (upcoming as CourseListQuery["upcoming"])
      : "all",
  };
}

export function courseListHref(query: Partial<CourseListQuery> = {}): PathnameHref {
  return {
    pathname: "/admin/courses",
    query: {
      q: query.q || undefined,
      category: query.category && query.category !== "all" ? query.category : undefined,
      published: query.published && query.published !== "all" ? query.published : undefined,
      upcoming: query.upcoming && query.upcoming !== "all" ? query.upcoming : undefined,
    },
  };
}

export function parseCourseEnrolmentQuery(searchParams: {
  q?: string | string[];
  session?: string | string[];
  status?: string | string[];
}): CourseEnrolmentQuery {
  const status = firstString(searchParams.status);
  return {
    q: firstString(searchParams.q).trim(),
    session: firstString(searchParams.session).trim(),
    status: STATUSES.includes(status as CourseEnrolmentQuery["status"])
      ? (status as CourseEnrolmentQuery["status"])
      : "all",
  };
}

export function parseCourseRecordQuery(searchParams: {
  q?: string | string[];
  session?: string | string[];
  status?: string | string[];
  tab?: string | string[];
  show?: string | string[];
}): CourseRecordQuery {
  const enrolment = parseCourseEnrolmentQuery(searchParams);
  const tab = firstString(searchParams.tab);
  const show = firstString(searchParams.show);
  const hasEnrolmentFilter = Boolean(
    enrolment.q || enrolment.session || enrolment.status !== "all",
  );

  return {
    ...enrolment,
    tab: COURSE_RECORD_TABS.includes(tab as CourseRecordTab)
      ? (tab as CourseRecordTab)
      : hasEnrolmentFilter
        ? "enrolments"
        : "sessions",
    show: COURSE_SESSION_SHOWS.includes(show as CourseSessionShow)
      ? (show as CourseSessionShow)
      : "all",
  };
}

export function courseDetailHref(
  id: string,
  query: Partial<CourseRecordQuery> = {},
): PathnameHref {
  const tab = query.tab ?? "sessions";
  const show = query.show ?? "all";

  return {
    pathname: "/admin/courses/[id]",
    params: {id},
    query: {
      tab: tab === "sessions" ? undefined : tab,
      show: tab === "sessions" && show !== "all" ? show : undefined,
      q: tab === "enrolments" ? query.q || undefined : undefined,
      session: tab === "enrolments" ? query.session || undefined : undefined,
      status:
        tab === "enrolments" && query.status && query.status !== "all"
          ? query.status
          : undefined,
    },
  };
}

export const COURSE_LIST_CATEGORIES = CATEGORIES;
export const COURSE_LIST_PUBLISHED = PUBLISHED;
export const COURSE_LIST_UPCOMING = UPCOMING;
export const COURSE_ENROLMENT_STATUSES = STATUSES;
