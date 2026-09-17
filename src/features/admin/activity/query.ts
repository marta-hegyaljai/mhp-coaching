import type {PathnameHref} from "@/i18n/href";

import {
  ACTIVITY_KINDS,
  type ActivityKind,
  type ActivityKindFilter,
} from "./types";

export type ActivityQuery = {
  kind: ActivityKindFilter;
  q: string;
  historyPage: number;
};

export const ACTIVITY_BOARD_SIZE = 40;

/**
 * Each channel is read page-deep so the merge can order rows globally, so the
 * reachable depth has to stay bounded no matter what a URL asks for.
 */
export const ACTIVITY_MAX_PAGE = 50;

const SEARCH_MAX_LENGTH = 80;

export const defaultActivityQuery: ActivityQuery = {
  kind: "all",
  q: "",
  historyPage: 1,
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

export type ActivitySearchParams = {
  when?: string | string[];
  kind?: string | string[];
  q?: string | string[];
  page?: string | string[];
  hp?: string | string[];
};

function parsePage(value: string): number {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? Math.min(page, ACTIVITY_MAX_PAGE) : 1;
}

export function parseActivityQuery(search: ActivitySearchParams): ActivityQuery {
  const kind = firstString(search.kind);
  const historyPage = firstString(search.hp) || (
    firstString(search.when) === "history" ? firstString(search.page) : ""
  );

  return {
    kind: isKind(kind) ? kind : "all",
    q: firstString(search.q).trim().slice(0, SEARCH_MAX_LENGTH),
    historyPage: parsePage(historyPage),
  };
}

/** Only non-default values reach the URL, so the board stays a clean path. */
export function activityHref(query: Partial<ActivityQuery> = {}): PathnameHref {
  const merged = {...defaultActivityQuery, ...query};

  return {
    pathname: "/admin/overview",
    query: {
      ...(merged.kind !== "all" ? {kind: merged.kind} : {}),
      ...(merged.q ? {q: merged.q} : {}),
      ...(merged.historyPage > 1 ? {hp: String(merged.historyPage)} : {}),
    },
  };
}

/** Changing the channel always returns History to its first page. */
export function activityFilterHref(
  query: ActivityQuery,
  patch: Partial<Pick<ActivityQuery, "kind">>,
): PathnameHref {
  return activityHref({...query, ...patch, historyPage: 1});
}

export function activityHistoryPageHref(query: ActivityQuery, page: number): PathnameHref {
  return activityHref({...query, historyPage: page});
}
