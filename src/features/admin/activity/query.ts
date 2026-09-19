import type {PathnameHref} from "@/i18n/href";
import {todayInZurich} from "@/features/rooms/timezone";
import {isIsoDate} from "@/shared/ui/date-field-calendar";

import {
  ACTIVITY_KINDS,
  ACTIVITY_WINDOWS,
  type ActivityKind,
  type ActivityKindFilter,
  type ActivityWindow,
} from "./types";

export type ActivityQuery = {
  kind: ActivityKindFilter;
  q: string;
  historyPage: number;
  /** Zurich day the Today pane is showing. `null` means the current day. */
  day: string | null;
  showUpcomingCancelled: boolean;
  showHistoryCancelled: boolean;
  /**
   * Which pane a phone is looking at. Desktop still shows all three; the
   * default Today stays off the path.
   */
  window: ActivityWindow;
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
  day: null,
  showUpcomingCancelled: false,
  showHistoryCancelled: false,
  window: "today",
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
  hp?: string | string[];
  day?: string | string[];
  uc?: string | string[];
  hc?: string | string[];
};

function parsePage(value: string): number {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? Math.min(page, ACTIVITY_MAX_PAGE) : 1;
}

function parseDay(value: string, today: string): string | null {
  return isIsoDate(value) && value !== today ? value : null;
}

export function parseActivityQuery(
  search: ActivitySearchParams,
  now = new Date(),
): ActivityQuery {
  const kind = firstString(search.kind);
  const when = firstString(search.when);
  const historyPage = firstString(search.hp) || (
    when === "history" ? firstString(search.page) : ""
  );

  return {
    kind: isKind(kind) ? kind : "all",
    q: firstString(search.q).trim().slice(0, SEARCH_MAX_LENGTH),
    historyPage: parsePage(historyPage),
    day: parseDay(firstString(search.day), todayInZurich(now)),
    showUpcomingCancelled: firstString(search.uc) === "1",
    showHistoryCancelled: firstString(search.hc) === "1",
    window: isWindow(when) ? when : "today",
  };
}

/** Only non-default values reach the URL, so the board stays a clean path. */
export function activityQueryParams(
  query: Partial<ActivityQuery> = {},
  now = new Date(),
): Record<string, string> {
  const merged = {...defaultActivityQuery, ...query};
  const day =
    merged.day && merged.day !== todayInZurich(now) ? merged.day : null;

  return {
    ...(merged.window !== "today" ? {when: merged.window} : {}),
    ...(merged.kind !== "all" ? {kind: merged.kind} : {}),
    ...(merged.q ? {q: merged.q} : {}),
    ...(merged.historyPage > 1 ? {hp: String(merged.historyPage)} : {}),
    ...(day ? {day} : {}),
    ...(merged.showUpcomingCancelled ? {uc: "1"} : {}),
    ...(merged.showHistoryCancelled ? {hc: "1"} : {}),
  };
}

export function activityHref(
  query: Partial<ActivityQuery> = {},
  now = new Date(),
): PathnameHref {
  return {
    pathname: "/admin/overview",
    query: activityQueryParams(query, now),
  };
}

/** Zurich day the Today pane should load: a chosen day, or the current one. */
export function activityFocusDay(query: ActivityQuery, now = new Date()): string {
  return query.day ?? todayInZurich(now);
}

export function showsCancelledActivity(
  query: ActivityQuery,
  when: Exclude<ActivityWindow, "today">,
): boolean {
  return when === "upcoming"
    ? query.showUpcomingCancelled
    : query.showHistoryCancelled;
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
