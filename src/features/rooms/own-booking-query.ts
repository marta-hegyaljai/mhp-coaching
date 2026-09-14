import type {PathnameHref} from "@/i18n/href";

export type OwnBookingQuery = {
  showCancelled: boolean;
  notice: "reserved" | "cancelled" | null;
};

type RawSearchParams = {
  reserved?: string | string[];
  cancelled?: string | string[];
  status?: string | string[];
};

function firstString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export function parseOwnBookingQuery(searchParams: RawSearchParams): OwnBookingQuery {
  const reserved = firstString(searchParams.reserved) === "1";
  const cancelledNotice = firstString(searchParams.cancelled) === "1";
  return {
    showCancelled: firstString(searchParams.status) === "all",
    notice: reserved ? "reserved" : cancelledNotice ? "cancelled" : null,
  };
}

export function ownBookingListHref(query: OwnBookingQuery): PathnameHref {
  const params: {status?: string; reserved?: string; cancelled?: string} = {};
  if (query.showCancelled) {
    params.status = "all";
  }
  if (query.notice === "reserved") {
    params.reserved = "1";
  }
  if (query.notice === "cancelled") {
    params.cancelled = "1";
  }
  return Object.keys(params).length > 0
    ? {pathname: "/rooms/bookings", query: params}
    : "/rooms/bookings";
}
