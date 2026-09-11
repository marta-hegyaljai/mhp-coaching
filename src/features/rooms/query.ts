import type {AvailabilityView} from "@/features/rooms/availability";
import {parseLocalDate, todayInZurich} from "@/features/rooms/timezone";
import {isUuid} from "@/lib/uuid";

export type AvailabilityQuery = {
  view: AvailabilityView;
  date: string;
  roomId?: string;
};

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseAvailabilityQuery(search: {
  view?: string | string[];
  date?: string | string[];
  room?: string | string[];
}): AvailabilityQuery {
  const viewRaw = firstString(search.view);
  const view: AvailabilityView = viewRaw === "day" ? "day" : "week";
  const dateRaw = firstString(search.date) ?? todayInZurich();
  let date = todayInZurich();
  try {
    parseLocalDate(dateRaw);
    date = dateRaw;
  } catch {
    date = todayInZurich();
  }
  const room = firstString(search.room);
  return {
    view,
    date,
    roomId: room && isUuid(room) ? room : undefined,
  };
}

export function availabilityHref(query: AvailabilityQuery): {
  pathname: "/rooms";
  query: {view: string; date: string; room?: string};
} {
  return {
    pathname: "/rooms",
    query: {
      view: query.view,
      date: query.date,
      ...(query.roomId ? {room: query.roomId} : {}),
    },
  };
}
