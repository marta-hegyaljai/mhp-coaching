import type {PathnameHref} from "@/i18n/href";
import type {BookingStatus} from "@/db/schema";
import type {CourseCategory} from "@/features/courses/types";

const CATEGORIES: Array<CourseCategory | "all"> = [
  "all",
  "foundation",
  "advanced",
  "medical",
  "workshop",
];
const PUBLISHED = ["all", "yes", "no"] as const;
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
};

export type CourseEnrolmentQuery = {
  q: string;
  session: string;
  status: (typeof STATUSES)[number];
};

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function parseCourseListQuery(searchParams: {
  q?: string | string[];
  category?: string | string[];
  published?: string | string[];
}): CourseListQuery {
  const category = firstString(searchParams.category);
  const published = firstString(searchParams.published);
  return {
    q: firstString(searchParams.q).trim(),
    category: CATEGORIES.includes(category as CourseListQuery["category"])
      ? (category as CourseListQuery["category"])
      : "all",
    published: PUBLISHED.includes(published as CourseListQuery["published"])
      ? (published as CourseListQuery["published"])
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

export function courseDetailHref(
  id: string,
  query: Partial<CourseEnrolmentQuery> = {},
): PathnameHref {
  return {
    pathname: "/admin/courses/[id]",
    params: {id},
    query: {
      q: query.q || undefined,
      session: query.session || undefined,
      status: query.status && query.status !== "all" ? query.status : undefined,
    },
  };
}

export const COURSE_LIST_CATEGORIES = CATEGORIES;
export const COURSE_LIST_PUBLISHED = PUBLISHED;
export const COURSE_ENROLMENT_STATUSES = STATUSES;
