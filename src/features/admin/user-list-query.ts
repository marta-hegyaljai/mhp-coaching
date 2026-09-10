import type {PathnameHref} from "@/i18n/href";

export const USER_LIST_PAGE_SIZE = 25;
export const USER_LIST_SEARCH_MAX = 200;

export const USER_LIST_STATUSES = ["all", "active", "pending", "disabled"] as const;
export const USER_LIST_ACCESS = ["all", "admin", "rooms", "none"] as const;

export type UserListStatus = (typeof USER_LIST_STATUSES)[number];
export type UserListAccess = (typeof USER_LIST_ACCESS)[number];

export type UserListQuery = {
  q: string;
  status: UserListStatus;
  access: UserListAccess;
  page: number;
};

export const defaultUserListQuery: UserListQuery = {
  q: "",
  status: "all",
  access: "all",
  page: 1,
};

type RawSearchParams = {
  q?: string | string[];
  status?: string | string[];
  access?: string | string[];
  page?: string | string[];
};

function firstString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function isStatus(value: string): value is UserListStatus {
  return (USER_LIST_STATUSES as readonly string[]).includes(value);
}

function isAccess(value: string): value is UserListAccess {
  return (USER_LIST_ACCESS as readonly string[]).includes(value);
}

export function parseUserListQuery(searchParams: RawSearchParams): UserListQuery {
  const rawSearch = firstString(searchParams.q).trim().normalize("NFC");
  const statusValue = firstString(searchParams.status);
  const accessValue = firstString(searchParams.access);
  const pageValue = Number.parseInt(firstString(searchParams.page), 10);

  return {
    q: rawSearch.slice(0, USER_LIST_SEARCH_MAX),
    status: isStatus(statusValue) ? statusValue : "all",
    access: isAccess(accessValue) ? accessValue : "all",
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
  };
}

export function userListHref(query: UserListQuery): PathnameHref {
  const params: {q?: string; status?: string; access?: string; page?: string} = {};

  if (query.q) {
    params.q = query.q;
  }
  if (query.status !== "all") {
    params.status = query.status;
  }
  if (query.access !== "all") {
    params.access = query.access;
  }
  if (query.page > 1) {
    params.page = String(query.page);
  }

  return Object.keys(params).length > 0
    ? {pathname: "/admin/users", query: params}
    : "/admin/users";
}

export function userListHrefForPage(query: UserListQuery, page: number) {
  return userListHref({...query, page});
}
