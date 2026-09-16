import type {PathnameHref} from "@/i18n/href";

import {
  ACTIVITY_KINDS,
  ACTIVITY_WINDOWS,
  type ActivityKind,
  type ActivityWindow,
} from "./types";

export type ActivityKindFilter = ActivityKind | "all";

export type ActivityQuery = {
  when: ActivityWindow;
  kind: ActivityKindFilter;
  q: string;
  page: number;
};

export const ACTIVITY_PAGE_SIZE = 20;

/**
 * Each channel is read page-deep so the merge can order rows globally, so the
 * reachable depth has to stay bounded no matter what a URL asks for.
 */
export const ACTIVITY_MAX_PAGE = 50;

const SEARCH_MAX_LENGTH = 80;

export const defaultActivityQuery: ActivityQuery = {
  when: "today",
  kind: "all",
  q: "",
  page: 1,
};

function firstString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function isKind(value: string): value is ActivityKind {
  return (ACTIVITY_KINDS as readonly string[]).includes(value);
}

function isWindow(value: string): value is ActivityWindow {
  return (ACTIVITY_WINDOWS as readonly string[]).includes(value);
}

export type ActivitySearchParams = {
  when?: string | string[];
  kind?: string | string[];
  q?: string | string[];
  page?: string | string[];
};

export function parseActivityQuery(search: ActivitySearchParams): ActivityQuery {
  const when = firstString(search.when);
  const kind = firstString(search.kind);
  const page = Number.parseInt(firstString(search.page), 10);

  return {
    when: isWindow(when) ? when : defaultActivityQuery.when,
    kind: isKind(kind) ? kind : "all",
    q: firstString(search.q).trim().slice(0, SEARCH_MAX_LENGTH),
    page:
      Number.isFinite(page) && page > 0 ? Math.min(page, ACTIVITY_MAX_PAGE) : 1,
  };
}

/** Only non-default values reach the URL, so the base view stays a clean path. */
export function activityHref(query: Partial<ActivityQuery> = {}): PathnameHref {
  const merged = {...defaultActivityQuery, ...query};

  return {
    pathname: "/admin/overview",
    query: {
      ...(merged.when !== defaultActivityQuery.when ? {when: merged.when} : {}),
      ...(merged.kind !== "all" ? {kind: merged.kind} : {}),
      ...(merged.q ? {q: merged.q} : {}),
      ...(merged.page > 1 ? {page: String(merged.page)} : {}),
    },
  };
}

/** Changing the window or channel always returns to the first page. */
export function activityFilterHref(
  query: ActivityQuery,
  patch: Partial<Pick<ActivityQuery, "when" | "kind">>,
): PathnameHref {
  return activityHref({...query, ...patch, page: 1});
}

export function activityPageHref(query: ActivityQuery, page: number): PathnameHref {
  return activityHref({...query, page});
}
