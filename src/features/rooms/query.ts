import type {AvailabilityView} from "@/features/rooms/availability";
import {parseLocalDate, todayInZurich} from "@/features/rooms/timezone";
import {isUuid} from "@/lib/uuid";

export type AvailabilityQuery = {
  view: AvailabilityView;
  date: string;
  /** Empty means every active room; otherwise availability is limited to this subset. */
  roomIds: string[];
};

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function roomIds(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.flatMap((item) => item.split(",")).filter(isUuid))].slice(0, 50);
}

export function parseAvailabilityQuery(search: {
  view?: string | string[];
  date?: string | string[];
  room?: string | string[];
  rooms?: string | string[];
}): AvailabilityQuery {
  const viewRaw = firstString(search.view);
  const view: AvailabilityView =
    viewRaw === "day" ? "day" : viewRaw === "month" ? "month" : "week";
  const dateRaw = firstString(search.date) ?? todayInZurich();
  let date = todayInZurich();
  try {
    parseLocalDate(dateRaw);
    date = dateRaw;
  } catch {
    date = todayInZurich();
  }
  return {
    view,
    date,
    roomIds: roomIds(search.rooms ?? search.room),
  };
}

export function availabilityHref(query: AvailabilityQuery): {
  pathname: "/rooms";
  query: {view: string; date: string; rooms?: string};
} {
  return {
    pathname: "/rooms",
    query: {
      view: query.view,
      date: query.date,
      ...(query.roomIds.length > 0 ? {rooms: query.roomIds.join(",")} : {}),
    },
  };
}
