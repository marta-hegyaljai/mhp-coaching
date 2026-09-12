import type {PathnameHref} from "@/i18n/href";

export const AUDIT_HISTORY_PAGE_SIZE = 10;
export const AUDIT_HISTORY_HASH = "account-history";

type RawSearchParams = {
  history?: string | string[];
};

function firstString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export function parseAuditHistoryPage(searchParams: RawSearchParams): number {
  const pageValue = Number.parseInt(firstString(searchParams.history), 10);
  return Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;
}

export function userAuditHref(userId: string, page = 1): PathnameHref {
  return {
    pathname: "/admin/users/[id]",
    params: {id: userId},
    query: page > 1 ? {history: String(page)} : undefined,
    hash: AUDIT_HISTORY_HASH,
  };
}
