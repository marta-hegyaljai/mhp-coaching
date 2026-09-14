import type {PathnameHref} from "@/i18n/href";
import {ADMIN_BOOKING_PAGE_SIZE} from "@/features/rooms/repository";
import {parseLocalDate, todayInZurich} from "@/features/rooms/timezone";

export const ADMIN_BOOKING_STATUSES = ["all", "CONFIRMED", "CANCELLED"] as const;
export type AdminBookingStatusFilter = (typeof ADMIN_BOOKING_STATUSES)[number];
export const ADMIN_BOOKING_VIEWS = ["list", "day"] as const;
export type AdminBookingView = (typeof ADMIN_BOOKING_VIEWS)[number];

export type AdminBookingQuery = {
  q: string;
  status: AdminBookingStatusFilter;
  view: AdminBookingView;
  date: string;
  page: number;
};

export const defaultAdminBookingQuery: AdminBookingQuery = {
  q: "",
  status: "CONFIRMED",
  view: "list",
  date: "",
  page: 1,
};

type RawSearchParams = {
  q?: string | string[];
  status?: string | string[];
  view?: string | string[];
  date?: string | string[];
  page?: string | string[];
};

function firstString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function isStatus(value: string): value is AdminBookingStatusFilter {
  return (ADMIN_BOOKING_STATUSES as readonly string[]).includes(value);
}

function parseDate(value: string, fallback: string): string {
  if (!value) {
    return fallback;
  }
  try {
    parseLocalDate(value);
    return value;
  } catch {
    return fallback;
  }
}

export function parseAdminBookingQuery(
  searchParams: RawSearchParams,
  now = new Date(),
): AdminBookingQuery {
  const today = todayInZurich(now);
  const rawSearch = firstString(searchParams.q).trim().normalize("NFC");
  const statusValue = firstString(searchParams.status);
  const viewValue = firstString(searchParams.view);
  const pageValue = Number.parseInt(firstString(searchParams.page), 10);

  return {
    q: rawSearch.slice(0, 200),
    status: isStatus(statusValue) ? statusValue : "CONFIRMED",
    view: viewValue === "day" ? "day" : "list",
    date: parseDate(firstString(searchParams.date), today),
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
  };
}

export function showsCancelledBookings(status: AdminBookingStatusFilter): boolean {
  return status !== "CONFIRMED";
}

export function adminBookingListHref(query: AdminBookingQuery): PathnameHref {
  const params: {q?: string; status?: string; view?: string; date?: string; page?: string} = {};
  if (query.q) {
    params.q = query.q;
  }
  if (query.status !== "CONFIRMED") {
    params.status = query.status;
  }
  if (query.view === "day") {
    params.view = "day";
    params.date = query.date;
  }
  if (query.view === "list" && query.page > 1) {
    params.page = String(query.page);
  }
  return Object.keys(params).length > 0
    ? {pathname: "/admin/bookings", query: params}
    : "/admin/bookings";
}

export function adminBookingListHrefForPage(query: AdminBookingQuery, page: number) {
  return adminBookingListHref({...query, page});
}

export {ADMIN_BOOKING_PAGE_SIZE};
