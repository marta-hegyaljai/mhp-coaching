import {parseLocalDate, timeToMinutes} from "@/features/rooms/timezone";
import {isUuid} from "@/lib/uuid";

export type BookQuery = {
  roomId?: string;
  date?: string;
  start?: string;
  end?: string;
};

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseBookQuery(search: {
  room?: string | string[];
  date?: string | string[];
  start?: string | string[];
  end?: string | string[];
}): BookQuery {
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

export function bookHref(query: {roomId: string; date: string; start?: string; end?: string}): {
  pathname: "/rooms/book";
  query: {room: string; date: string; start?: string; end?: string};
} {
  return {
    pathname: "/rooms/book",
    query: {
      room: query.roomId,
      date: query.date,
      ...(query.start ? {start: query.start} : {}),
      ...(query.end ? {end: query.end} : {}),
    },
  };
}

export function changeBookingHref(
  bookingId: string,
  query: {roomId: string; date: string; start?: string; end?: string},
): {
  pathname: "/rooms/bookings/[id]/change";
  params: {id: string};
  query: {room: string; date: string; start?: string; end?: string};
} {
  return {
    pathname: "/rooms/bookings/[id]/change",
    params: {id: bookingId},
    query: {
      room: query.roomId,
      date: query.date,
      ...(query.start ? {start: query.start} : {}),
      ...(query.end ? {end: query.end} : {}),
    },
  };
}
