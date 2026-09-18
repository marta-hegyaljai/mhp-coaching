import type {PathnameHref} from "@/i18n/href";

export const ADMIN_ENROLMENT_PAGE_SIZE = 20;

export type AdminEnrolmentQuery = {
  q: string;
  showCancelled: boolean;
  page: number;
};

export const defaultAdminEnrolmentQuery: AdminEnrolmentQuery = {
  q: "",
  showCancelled: false,
  page: 1,
};

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function parseAdminEnrolmentQuery(searchParams: {
  q?: string | string[];
  cancelled?: string | string[];
  page?: string | string[];
}): AdminEnrolmentQuery {
  const pageValue = Number.parseInt(firstString(searchParams.page), 10);

  return {
    q: firstString(searchParams.q).trim().slice(0, 80),
    showCancelled: firstString(searchParams.cancelled) === "1",
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
  };
}

export function adminEnrolmentListHref(
  query: Partial<AdminEnrolmentQuery> = {},
): PathnameHref {
  const merged = {...defaultAdminEnrolmentQuery, ...query};

  return {
    pathname: "/admin/courses/enrolments",
    query: {
      q: merged.q || undefined,
      cancelled: merged.showCancelled ? "1" : undefined,
      page: merged.page > 1 ? String(merged.page) : undefined,
    },
  };
}

export function adminEnrolmentListHrefForPage(
  query: AdminEnrolmentQuery,
  page: number,
): PathnameHref {
  return adminEnrolmentListHref({...query, page});
}

export function paginateAdminEnrolments<T>(
  rows: readonly T[],
  page: number,
  pageSize = ADMIN_ENROLMENT_PAGE_SIZE,
) {
  const size = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * size;

  return {
    items: rows.slice(start, start + size),
    total: rows.length,
    page: safePage,
    pageCount,
    pageSize: size,
  };
}
