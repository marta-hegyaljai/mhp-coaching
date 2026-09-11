import type {PathnameHref} from "@/i18n/href";
import {ADMIN_BOOKING_PAGE_SIZE} from "@/features/rooms/repository";

export const ADMIN_BOOKING_STATUSES = ["all", "CONFIRMED", "CANCELLED"] as const;
export type AdminBookingStatusFilter = (typeof ADMIN_BOOKING_STATUSES)[number];

export type AdminBookingQuery = {
  q: string;
  status: AdminBookingStatusFilter;
  page: number;
};

export const defaultAdminBookingQuery: AdminBookingQuery = {
  q: "",
  status: "all",
  page: 1,
};

type RawSearchParams = {
  q?: string | string[];
  status?: string | string[];
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

export function parseAdminBookingQuery(searchParams: RawSearchParams): AdminBookingQuery {
  const rawSearch = firstString(searchParams.q).trim().normalize("NFC");
  const statusValue = firstString(searchParams.status);
  const pageValue = Number.parseInt(firstString(searchParams.page), 10);

  return {
    q: rawSearch.slice(0, 200),
    status: isStatus(statusValue) ? statusValue : "all",
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
  };
}

export function adminBookingListHref(query: AdminBookingQuery): PathnameHref {
  const params: {q?: string; status?: string; page?: string} = {};
  if (query.q) {
    params.q = query.q;
  }
  if (query.status !== "all") {
    params.status = query.status;
  }
  if (query.page > 1) {
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
