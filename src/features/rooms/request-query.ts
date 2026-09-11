import {parseLocalDate, timeToMinutes} from "@/features/rooms/timezone";
import type {PathnameHref} from "@/i18n/href";
import {isUuid} from "@/lib/uuid";

export const ADMIN_REQUEST_STATUSES = ["all", "OPEN", "RESOLVED", "DECLINED"] as const;
export type AdminRequestStatusFilter = (typeof ADMIN_REQUEST_STATUSES)[number];

export type RequestDraftQuery = {
  roomId?: string;
  date?: string;
  start?: string;
  end?: string;
};

export type AdminRequestQuery = {
  q: string;
  status: AdminRequestStatusFilter;
  page: number;
};

export const defaultAdminRequestQuery: AdminRequestQuery = {
  q: "",
  status: "OPEN",
  page: 1,
};

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseRequestDraftQuery(search: {
  room?: string | string[];
  date?: string | string[];
  start?: string | string[];
  end?: string | string[];
}): RequestDraftQuery {
  const room = firstString(search.room);
  const dateRaw = firstString(search.date);
  const startRaw = firstString(search.start);
  const endRaw = firstString(search.end);

  let date: string | undefined;
  if (dateRaw) {
    try {
      parseLocalDate(dateRaw);
      date = dateRaw;
    } catch {
      date = undefined;
    }
  }

  let start: string | undefined;
  if (startRaw) {
    try {
      timeToMinutes(startRaw);
      start = startRaw;
    } catch {
      start = undefined;
    }
  }

  let end: string | undefined;
  if (endRaw) {
    try {
      timeToMinutes(endRaw);
      end = endRaw;
    } catch {
      end = undefined;
    }
  }

  return {
    roomId: room && isUuid(room) ? room : undefined,
    date,
    start,
    end,
  };
}

export function requestHref(query: {
  roomId?: string;
  date?: string;
  start?: string;
  end?: string;
}): PathnameHref {
  const params: {room?: string; date?: string; start?: string; end?: string} = {};
  if (query.roomId) {
    params.room = query.roomId;
  }
  if (query.date) {
    params.date = query.date;
  }
  if (query.start) {
    params.start = query.start;
  }
  if (query.end) {
    params.end = query.end;
  }
  return Object.keys(params).length > 0
    ? {pathname: "/rooms/requests/new", query: params}
    : "/rooms/requests/new";
}

function isStatus(value: string): value is AdminRequestStatusFilter {
  return (ADMIN_REQUEST_STATUSES as readonly string[]).includes(value);
}

export function parseAdminRequestQuery(searchParams: {
  q?: string | string[];
  status?: string | string[];
  page?: string | string[];
}): AdminRequestQuery {
  const rawSearch = (firstString(searchParams.q) ?? "").trim().normalize("NFC");
  const statusRaw = firstString(searchParams.status) ?? "";
  const pageValue = Number.parseInt(firstString(searchParams.page) ?? "", 10);

  return {
    q: rawSearch.slice(0, 200),
    status: isStatus(statusRaw) ? statusRaw : defaultAdminRequestQuery.status,
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
  };
}

export function adminRequestListHref(query: AdminRequestQuery): PathnameHref {
  const params: {q?: string; status?: string; page?: string} = {};
  if (query.q) {
    params.q = query.q;
  }
  if (query.status !== "OPEN") {
    params.status = query.status;
  }
  if (query.page > 1) {
    params.page = String(query.page);
  }
  return Object.keys(params).length > 0
    ? {pathname: "/admin/requests", query: params}
    : "/admin/requests";
}

export function adminRequestListHrefForPage(query: AdminRequestQuery, page: number) {
  return adminRequestListHref({...query, page});
}
