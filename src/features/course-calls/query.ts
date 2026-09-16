import type {PathnameHref} from "@/i18n/href";

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export const ADMIN_CALL_TABS = ["agenda", "hours", "messages"] as const;
export type AdminCallTab = (typeof ADMIN_CALL_TABS)[number];

export const ADMIN_CALL_WHENS = ["upcoming", "past", "all"] as const;
export type AdminCallWhen = (typeof ADMIN_CALL_WHENS)[number];

export type AdminCallQuery = {
  tab: AdminCallTab;
  when: AdminCallWhen;
  q: string;
  page: number;
};

export const defaultAdminCallQuery: AdminCallQuery = {
  tab: "agenda",
  when: "upcoming",
  q: "",
  page: 1,
};

const PAGE_SIZE = 20;

export function adminCallPageSize(): number {
  return PAGE_SIZE;
}

export function parseAdminCallQuery(search: {
  tab?: string | string[];
  when?: string | string[];
  q?: string | string[];
  page?: string | string[];
}): AdminCallQuery {
  const tabRaw = firstString(search.tab);
  const whenRaw = firstString(search.when);
  const q = (firstString(search.q) ?? "").trim().slice(0, 80);
  const pageRaw = Number(firstString(search.page) ?? "1");
  return {
    tab: ADMIN_CALL_TABS.includes(tabRaw as AdminCallTab)
      ? (tabRaw as AdminCallTab)
      : "agenda",
    when: ADMIN_CALL_WHENS.includes(whenRaw as AdminCallWhen)
      ? (whenRaw as AdminCallWhen)
      : "upcoming",
    q,
    page: Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  };
}

export function adminCallListHref(query: Partial<AdminCallQuery> = {}): PathnameHref {
  const merged = {...defaultAdminCallQuery, ...query};
  return {
    pathname: "/admin/calls",
    query: {
      ...(merged.tab !== "agenda" ? {tab: merged.tab} : {}),
      ...(merged.tab === "agenda" && merged.when !== "upcoming" ? {when: merged.when} : {}),
      ...(merged.q ? {q: merged.q} : {}),
      ...(merged.page > 1 ? {page: String(merged.page)} : {}),
    },
  };
}

export function adminCallListHrefForPage(
  query: AdminCallQuery,
  page: number,
): PathnameHref {
  return adminCallListHref({...query, page});
}
