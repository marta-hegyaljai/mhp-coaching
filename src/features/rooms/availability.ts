import type {User} from "@/db/schema";
import {canAccessRooms, canAdminister} from "@/features/auth/policy";
import {RoomError} from "@/features/rooms/errors";
import {
  getBookingSettings,
  listBlocksForRooms,
  listConfirmedBookings,
  listOpeningIntervals,
  listRooms,
} from "@/features/rooms/repository";
import {
  addLocalDays,
  isoWeekday,
  minutesToTime,
  mondayOf,
  parseLocalDate,
  rangesOverlap,
  zurichLocalToUtc,
} from "@/features/rooms/timezone";
import {isUuid} from "@/lib/uuid";

export type AvailabilityView = "day" | "week";
export type AvailabilityState = "available" | "booked" | "unavailable" | "my-booking";

export type AvailabilityRoom = {
  id: string;
  name: string;
  description: string;
  hourlyRateMinor: number;
  currency: "CHF";
  active: boolean;
};

export type TherapistAvailabilitySlot = {
  roomId: string;
  startsAt: string;
  endsAt: string;
  localDate: string;
  localStart: string;
  localEnd: string;
  state: AvailabilityState;
  ownBookingId?: string;
};

export type AdminAvailabilitySlot = {
  roomId: string;
  startsAt: string;
  endsAt: string;
  localDate: string;
  localStart: string;
  localEnd: string;
  state: Exclude<AvailabilityState, "my-booking">;
};

export type TherapistAvailability = {
  timezone: "Europe/Zurich";
  view: AvailabilityView;
  startDate: string;
  endDate: string;
  intervalMinutes: number;
  rooms: AvailabilityRoom[];
  slots: TherapistAvailabilitySlot[];
};

export type AdminAvailability = {
  timezone: "Europe/Zurich";
  view: AvailabilityView;
  startDate: string;
  endDate: string;
  intervalMinutes: number;
  rooms: AvailabilityRoom[];
  slots: AdminAvailabilitySlot[];
};

function requireTherapist(actor: User): void {
  if (!canAccessRooms(actor)) {
    throw new RoomError("forbidden");
  }
}

function requireAdmin(actor: User): void {
  if (!canAdminister(actor)) {
    throw new RoomError("forbidden");
  }
}

function toPublicRoom(room: {
  id: string;
  name: string;
  description: string;
  hourlyRateMinor: number;
  currency: string;
  active: boolean;
}): AvailabilityRoom {
  return {
    id: room.id,
    name: room.name,
    description: room.description,
    hourlyRateMinor: room.hourlyRateMinor,
    currency: "CHF",
    active: room.active,
  };
}

function fullyWithinOpening(
  startMinute: number,
  endMinute: number,
  openings: Array<{startMinute: number; endMinute: number}>,
): boolean {
  return openings.some(
    (opening) => startMinute >= opening.startMinute && endMinute <= opening.endMinute,
  );
}

function buildRange(view: AvailabilityView, date: string): {startDate: string; endDate: string} {
  parseLocalDate(date);
  if (view === "day") {
    return {startDate: date, endDate: date};
  }
  const startDate = mondayOf(date);
  return {startDate, endDate: addLocalDays(startDate, 6)};
}

type OccupancySpan = {id?: string; startsAt: Date; endsAt: Date};

type RoomOccupancy = {
  own: OccupancySpan[];
  other: OccupancySpan[];
  blocks: OccupancySpan[];
};

function indexOccupancy(
  rooms: Array<{id: string}>,
  actorId: string,
  bookings: Array<{
    id: string;
    roomId: string;
    userId: string;
    startsAt: Date;
    endsAt: Date;
  }>,
  blocks: Array<{roomId: string; startsAt: Date; endsAt: Date}>,
): Map<string, RoomOccupancy> {
  const byRoom = new Map<string, RoomOccupancy>();
  for (const room of rooms) {
    byRoom.set(room.id, {own: [], other: [], blocks: []});
  }

  for (const booking of bookings) {
    const occupancy = byRoom.get(booking.roomId);
    if (!occupancy) {
      continue;
    }
    const span = {id: booking.id, startsAt: booking.startsAt, endsAt: booking.endsAt};
    if (booking.userId === actorId) {
      occupancy.own.push(span);
    } else {
      occupancy.other.push(span);
    }
  }

  for (const block of blocks) {
    byRoom.get(block.roomId)?.blocks.push({
      startsAt: block.startsAt,
      endsAt: block.endsAt,
    });
  }

  return byRoom;
}

function overlappingSpan(
  spans: OccupancySpan[],
  start: Date,
  end: Date,
): OccupancySpan | undefined {
  return spans.find((span) => rangesOverlap(start, end, span.startsAt, span.endsAt));
}

async function loadGrid(input: {
  view: AvailabilityView;
  date: string;
  roomId?: string;
}) {
  const range = buildRange(input.view, input.date);
  const settings = await getBookingSettings();
  const openings = await listOpeningIntervals();
  const catalog = await listRooms();
  // Keep the complete active inventory in the response even when one room is
  // selected. The room filter is navigation, not a destructive payload filter:
  // removing siblings left users stranded with no way to switch back.
  // A selected inactive room is retained only so a stale URL can explain why
  // it is unavailable instead of silently changing the user's selection.
  const listed = catalog.filter((room) => room.active || room.id === input.roomId);

  // Generate slots only for the room(s) the grid displays. Week columns are
  // days of one room; day view may compare all rooms when no filter is active.
  const selectedRoom = input.roomId
    ? listed.find((room) => room.id === input.roomId)
    : undefined;
  const slotRooms = input.roomId
    ? selectedRoom
      ? [selectedRoom]
      : []
    : input.view === "week" && listed.length > 0
      ? [listed[0]]
      : listed;

  const from = zurichLocalToUtc(range.startDate, "00:00");
  const to = zurichLocalToUtc(addLocalDays(range.endDate, 1), "00:00");
  const rangeStart = from.ok ? from.instant : new Date(0);
  const rangeEnd = to.ok ? to.instant : new Date(0);

  const slotIds = slotRooms.map((room) => room.id);
  const [blocks, bookings] = await Promise.all([
    listBlocksForRooms(slotIds, rangeStart, rangeEnd),
    listConfirmedBookings(slotIds, rangeStart, rangeEnd),
  ]);

  return {range, settings, openings, rooms: listed, slotRooms, blocks, bookings};
}

function classifySlot(input: {
  roomActive: boolean;
  startMinute: number;
  endMinute: number;
  openings: Array<{startMinute: number; endMinute: number}>;
  blocked: boolean;
  startsInPast: boolean;
  ownBookingId?: string;
  otherBooking: boolean;
}): AvailabilityState {
  if (
    !input.roomActive ||
    input.blocked ||
    input.startsInPast ||
    !fullyWithinOpening(input.startMinute, input.endMinute, input.openings)
  ) {
    if (input.ownBookingId) {
      return "my-booking";
    }
    if (input.otherBooking) {
      return "booked";
    }
    return "unavailable";
  }
  if (input.ownBookingId) {
    return "my-booking";
  }
  if (input.otherBooking) {
    return "booked";
  }
  return "available";
}

function iterateDays(startDate: string, endDate: string): string[] {
  const days = [startDate];
  let cursor = startDate;
  while (cursor < endDate) {
    cursor = addLocalDays(cursor, 1);
    days.push(cursor);
  }
  return days;
}

function displayWindow(
  openings: Array<{startMinute: number; endMinute: number}>,
): {startMinute: number; endMinute: number} {
  if (openings.length === 0) {
    return {startMinute: 7 * 60, endMinute: 21 * 60};
  }
  return {
    startMinute: Math.min(...openings.map((item) => item.startMinute)),
    endMinute: Math.max(...openings.map((item) => item.endMinute)),
  };
}

export async function therapistAvailability(input: {
  actor: User;
  view: AvailabilityView;
  date: string;
  roomId?: string;
  now?: Date;
}): Promise<TherapistAvailability> {
  requireTherapist(input.actor);
  if (input.roomId && !isUuid(input.roomId)) {
    throw new RoomError("notFound");
  }

  const now = input.now ?? new Date();
  const grid = await loadGrid({
    view: input.view,
    date: input.date,
    roomId: input.roomId,
  });

  const interval = grid.settings.bookingIntervalMinutes;
  const allOpenings = grid.openings;
  const window = displayWindow(allOpenings);
  const occupancy = indexOccupancy(
    grid.slotRooms,
    input.actor.id,
    grid.bookings,
    grid.blocks,
  );
  const slots: TherapistAvailabilitySlot[] = [];

  for (const room of grid.slotRooms) {
    const roomOccupancy = occupancy.get(room.id) ?? {own: [], other: [], blocks: []};
    for (const localDate of iterateDays(grid.range.startDate, grid.range.endDate)) {
      const weekday = isoWeekday(localDate);
      const dayOpenings = allOpenings.filter((item) => item.weekday === weekday);
      for (let minute = window.startMinute; minute < window.endMinute; minute += interval) {
        const endMinute = minute + interval;
        const startLocal = minutesToTime(minute);
        const endLocal = minutesToTime(endMinute);
        const start = zurichLocalToUtc(localDate, startLocal);
        const end = zurichLocalToUtc(localDate, endLocal);
        if (!start.ok || !end.ok) {
          slots.push({
            roomId: room.id,
            startsAt: "",
            endsAt: "",
            localDate,
            localStart: startLocal,
            localEnd: endLocal,
            state: "unavailable",
          });
          continue;
        }

        const own = overlappingSpan(roomOccupancy.own, start.instant, end.instant);
        const other = Boolean(
          overlappingSpan(roomOccupancy.other, start.instant, end.instant),
        );
        const blocked = Boolean(
          overlappingSpan(roomOccupancy.blocks, start.instant, end.instant),
        );

        const slot: TherapistAvailabilitySlot = {
          roomId: room.id,
          startsAt: start.instant.toISOString(),
          endsAt: end.instant.toISOString(),
          localDate,
          localStart: startLocal,
          localEnd: endLocal,
          state: classifySlot({
            roomActive: room.active,
            startMinute: minute,
            endMinute,
            openings: dayOpenings,
            blocked,
            startsInPast: start.instant.getTime() <= now.getTime(),
            ownBookingId: own?.id,
            otherBooking: other,
          }),
        };
        if (slot.state === "my-booking" && own?.id) {
          slot.ownBookingId = own.id;
        }
        slots.push(slot);
      }
    }
  }

  const payload: TherapistAvailability = {
    timezone: "Europe/Zurich",
    view: input.view,
    startDate: grid.range.startDate,
    endDate: grid.range.endDate,
    intervalMinutes: interval,
    rooms: grid.rooms.map(toPublicRoom),
    slots,
  };

  assertPrivacySafePayload(payload);
  return payload;
}

export async function adminAvailability(input: {
  actor: User;
  view: AvailabilityView;
  date: string;
  roomId?: string;
  now?: Date;
}): Promise<AdminAvailability> {
  requireAdmin(input.actor);
  const therapistLike = await therapistAvailability({
    actor: {
      ...input.actor,
      roomBookingEnabled: true,
      disabledAt: null,
    },
    view: input.view,
    date: input.date,
    roomId: input.roomId,
    now: input.now,
  });

  const payload: AdminAvailability = {
    timezone: therapistLike.timezone,
    view: therapistLike.view,
    startDate: therapistLike.startDate,
    endDate: therapistLike.endDate,
    intervalMinutes: therapistLike.intervalMinutes,
    rooms: therapistLike.rooms,
    slots: therapistLike.slots.map((slot) => ({
      roomId: slot.roomId,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      localDate: slot.localDate,
      localStart: slot.localStart,
      localEnd: slot.localEnd,
      state: slot.state === "my-booking" ? "booked" : slot.state,
    })),
  };
  assertPrivacySafePayload(payload);
  return payload;
}

export function assertPrivacySafePayload(value: unknown): void {
  const encoded = JSON.stringify(value);
  const forbidden = [
    "userId",
    "email",
    "firstName",
    "lastName",
    "note",
    "notes",
    "password",
    "passwordHash",
  ];
  for (const key of forbidden) {
    if (encoded.includes(`"${key}"`)) {
      throw new Error(`Availability payload leaked ${key}`);
    }
  }
}
