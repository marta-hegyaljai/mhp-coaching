import type {Room, RoomBooking, RoomOpeningInterval, User} from "@/db/schema";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {canAccessRooms} from "@/features/auth/policy";
import {recordAudit} from "@/features/auth/repository";
import {RoomError} from "@/features/rooms/errors";
import {requireRoom} from "@/features/rooms/inventory";
import {
  durationMinutesBetween,
  quoteRoomBooking,
  therapistDiscountPercent,
  type RoomBookingQuote,
} from "@/features/rooms/pricing";
import {
  findRoomById,
  getBookingSettings,
  insertConfirmedBookingUnlessOccupied,
  listBlocksForRooms,
  listConfirmedBookings,
  listOpeningIntervals,
} from "@/features/rooms/repository";
import {
  addLocalDays,
  isoWeekday,
  parseLocalDate,
  timeToMinutes,
  todayInZurich,
  utcToZurich,
  zurichLocalToUtc,
} from "@/features/rooms/timezone";

export type BookableEnd = {
  time: string;
  durationMinutes: number;
  quote: RoomBookingQuote;
};

export type ReservationPreview = {
  room: {
    id: string;
    name: string;
    hourlyRateMinor: number;
    currency: "CHF";
  };
  date: string;
  start: string;
  end: string;
  starts: string[];
  ends: BookableEnd[];
  endsByStart: Record<string, BookableEnd[]>;
  quote: RoomBookingQuote;
};

function requireTherapist(actor: User): void {
  if (!canAccessRooms(actor)) {
    throw new RoomError("forbidden");
  }
}

function requireActiveRoom(room: Room): Room {
  if (!room.active) {
    throw new RoomError("disabledRoom");
  }
  return room;
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

function alignedToInterval(minute: number, interval: number): boolean {
  return minute % interval === 0;
}

function instantFor(date: string, time: string): Date {
  const converted = zurichLocalToUtc(date, time);
  if (!converted.ok) {
    throw new RoomError(converted.reason === "ambiguous" ? "ambiguousTime" : "invalidTime");
  }
  return converted.instant;
}

function sameZurichDay(start: Date, end: Date): boolean {
  const startLocal = utcToZurich(start);
  const endLocal = utcToZurich(end);
  return startLocal.date === endLocal.date || endLocal.time === "00:00";
}

function occupancyOverlaps(
  spans: Array<{startsAt: Date; endsAt: Date}>,
  start: Date,
  end: Date,
): boolean {
  return spans.some((span) => start < span.endsAt && span.startsAt < end);
}

async function loadBookableContext(
  roomId: string,
  date: string,
  now: Date,
  exceptBookingId?: string,
) {
  try {
    parseLocalDate(date);
  } catch {
    throw new RoomError("invalidTime");
  }

  const [settings, openings, room] = await Promise.all([
    getBookingSettings(),
    listOpeningIntervals(),
    findRoomById(roomId).then((found) => {
      if (!found) {
        throw new RoomError("notFound");
      }
      return found;
    }),
  ]);

  const dayOpenings = openings.filter((item) => item.weekday === isoWeekday(date));
  const from = instantFor(date, "00:00");
  const to = instantFor(addLocalDays(date, 1), "00:00");
  const [blocks, bookings] = await Promise.all([
    listBlocksForRooms([roomId], from, to),
    listConfirmedBookings([roomId], from, to, exceptBookingId),
  ]);

  return {settings, openings: dayOpenings, room, blocks, bookings, now};
}

function validateInterval(input: {
  room: Room;
  date: string;
  start: string;
  end: string;
  settings: {
    bookingIntervalMinutes: number;
    minimumBookingMinutes: number;
    maximumBookingMinutes: number | null;
    maximumAdvanceBookingDays: number | null;
  };
  openings: RoomOpeningInterval[];
  blocks: Array<{startsAt: Date; endsAt: Date}>;
  bookings: Array<{startsAt: Date; endsAt: Date}>;
  now: Date;
  discountPercent: number;
}): {startsAt: Date; endsAt: Date; quote: RoomBookingQuote} {
  requireActiveRoom(input.room);

  let startMinute: number;
  let endMinute: number;
  try {
    startMinute = timeToMinutes(input.start);
    endMinute = timeToMinutes(input.end);
  } catch {
    throw new RoomError("invalidTime");
  }

  if (endMinute <= startMinute) {
    throw new RoomError("invalidRange");
  }

  const interval = input.settings.bookingIntervalMinutes;
  if (!alignedToInterval(startMinute, interval) || !alignedToInterval(endMinute, interval)) {
    throw new RoomError("invalidIncrement");
  }

  const durationMinutes = endMinute - startMinute;
  if (durationMinutes % interval !== 0) {
    throw new RoomError("invalidIncrement");
  }
  if (durationMinutes < input.settings.minimumBookingMinutes) {
    throw new RoomError("invalidDuration");
  }
  if (
    input.settings.maximumBookingMinutes !== null &&
    durationMinutes > input.settings.maximumBookingMinutes
  ) {
    throw new RoomError("invalidDuration");
  }

  const startsAt = instantFor(input.date, input.start);
  const endsAt = instantFor(input.date, input.end);
  if (endsAt <= startsAt) {
    throw new RoomError("invalidRange");
  }
  if (!sameZurichDay(startsAt, endsAt) && utcToZurich(endsAt).time !== "00:00") {
    throw new RoomError("invalidRange");
  }
  if (durationMinutesBetween(startsAt, endsAt) !== durationMinutes) {
    throw new RoomError("invalidDuration");
  }

  if (startsAt.getTime() <= input.now.getTime()) {
    throw new RoomError("tooSoon");
  }

  const today = todayInZurich(input.now);
  if (
    input.settings.maximumAdvanceBookingDays !== null &&
    input.date > addLocalDays(today, input.settings.maximumAdvanceBookingDays)
  ) {
    throw new RoomError("tooFar");
  }

  if (!fullyWithinOpening(startMinute, endMinute, input.openings)) {
    throw new RoomError("closedHours");
  }

  if (occupancyOverlaps(input.blocks, startsAt, endsAt)) {
    throw new RoomError("blocked");
  }

  if (occupancyOverlaps(input.bookings, startsAt, endsAt)) {
    throw new RoomError("slotConflict");
  }

  return {
    startsAt,
    endsAt,
    quote: quoteRoomBooking({
      hourlyRateMinor: input.room.hourlyRateMinor,
      durationMinutes,
      discountPercent: input.discountPercent,
    }),
  };
}

function listEndsForStart(input: {
  room: Room;
  date: string;
  start: string;
  settings: {
    bookingIntervalMinutes: number;
    minimumBookingMinutes: number;
    maximumBookingMinutes: number | null;
    maximumAdvanceBookingDays: number | null;
  };
  openings: RoomOpeningInterval[];
  blocks: Array<{startsAt: Date; endsAt: Date}>;
  bookings: Array<{startsAt: Date; endsAt: Date}>;
  now: Date;
  discountPercent: number;
}): BookableEnd[] {
  let startMinute: number;
  try {
    startMinute = timeToMinutes(input.start);
  } catch {
    return [];
  }

  const interval = input.settings.bookingIntervalMinutes;
  const ends: BookableEnd[] = [];
  const latest = input.settings.maximumBookingMinutes ?? 24 * 60;

  for (
    let endMinute = startMinute + input.settings.minimumBookingMinutes;
    endMinute <= startMinute + latest && endMinute <= 1440;
    endMinute += interval
  ) {
    try {
      const validated = validateInterval({
        ...input,
        end: endMinute === 1440 ? "24:00" : minuteLabel(endMinute),
      });
      ends.push({
        time: endMinute === 1440 ? "24:00" : minuteLabel(endMinute),
        durationMinutes: validated.quote.durationMinutes,
        quote: validated.quote,
      });
    } catch (error) {
      if (error instanceof RoomError && error.code === "closedHours") {
        break;
      }
    }
  }

  return ends;
}

function minuteLabel(total: number): string {
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function listStarts(input: {
  room: Room;
  date: string;
  settings: {
    bookingIntervalMinutes: number;
    minimumBookingMinutes: number;
    maximumBookingMinutes: number | null;
    maximumAdvanceBookingDays: number | null;
  };
  openings: RoomOpeningInterval[];
  blocks: Array<{startsAt: Date; endsAt: Date}>;
  bookings: Array<{startsAt: Date; endsAt: Date}>;
  now: Date;
  discountPercent: number;
}): string[] {
  const interval = input.settings.bookingIntervalMinutes;
  const starts = new Set<string>();

  for (const opening of input.openings) {
    for (
      let startMinute = opening.startMinute;
      startMinute + input.settings.minimumBookingMinutes <= opening.endMinute;
      startMinute += interval
    ) {
      const start = minuteLabel(startMinute);
      if (listEndsForStart({...input, start}).length > 0) {
        starts.add(start);
      }
    }
  }

  return [...starts].sort();
}

export async function previewReservation(input: {
  actor: User;
  roomId: string;
  date: string;
  start?: string;
  end?: string;
  now?: Date;
  exceptBookingId?: string;
  discountActor?: User;
}): Promise<ReservationPreview> {
  requireTherapist(input.actor);
  return previewBookableSlot({
    roomId: input.roomId,
    date: input.date,
    start: input.start,
    end: input.end,
    now: input.now,
    exceptBookingId: input.exceptBookingId,
    discountPercent: therapistDiscountPercent(input.discountActor ?? input.actor),
  });
}

export async function previewBookableSlot(input: {
  roomId: string;
  date: string;
  start?: string;
  end?: string;
  now?: Date;
  exceptBookingId?: string;
  discountPercent?: number;
}): Promise<ReservationPreview> {
  const room = await requireRoom(input.roomId);
  const now = input.now ?? new Date();
  const context = await loadBookableContext(room.id, input.date, now, input.exceptBookingId);
  const discountPercent = input.discountPercent ?? 0;
  const shared = {
    room: context.room,
    date: input.date,
    settings: context.settings,
    openings: context.openings,
    blocks: context.blocks,
    bookings: context.bookings,
    now,
    discountPercent,
  };
  const starts = listStarts(shared);
  if (starts.length === 0) {
    throw new RoomError("slotUnavailable");
  }

  const start = input.start && starts.includes(input.start) ? input.start : starts[0];
  const endsByStart: Record<string, BookableEnd[]> = {};
  for (const candidate of starts) {
    endsByStart[candidate] = listEndsForStart({...shared, start: candidate});
  }
  const ends = endsByStart[start] ?? [];
  if (ends.length === 0) {
    throw new RoomError("slotUnavailable");
  }
  const selectedEnd =
    input.end && ends.some((item) => item.time === input.end)
      ? ends.find((item) => item.time === input.end)!
      : ends[0];

  return {
    room: {
      id: context.room.id,
      name: context.room.name,
      hourlyRateMinor: context.room.hourlyRateMinor,
      currency: "CHF",
    },
    date: input.date,
    start,
    end: selectedEnd.time,
    starts,
    ends,
    endsByStart,
    quote: selectedEnd.quote,
  };
}

export async function validateBookableInterval(input: {
  roomId: string;
  date: string;
  start: string;
  end: string;
  now?: Date;
  exceptBookingId?: string;
  discountPercent?: number;
}): Promise<{room: Room; startsAt: Date; endsAt: Date; quote: RoomBookingQuote}> {
  const room = await requireRoom(input.roomId);
  const now = input.now ?? new Date();
  const context = await loadBookableContext(room.id, input.date, now, input.exceptBookingId);
  const discountPercent = input.discountPercent ?? 0;
  const validated = validateInterval({
    room: context.room,
    date: input.date,
    start: input.start,
    end: input.end,
    settings: context.settings,
    openings: context.openings,
    blocks: context.blocks,
    bookings: context.bookings,
    now,
    discountPercent,
  });
  return {room: context.room, ...validated};
}

export async function reserveRoom(input: {
  actor: User;
  roomId: string;
  date: string;
  start: string;
  end: string;
  now?: Date;
}): Promise<RoomBooking> {
  requireTherapist(input.actor);
  const room = await requireRoom(input.roomId);
  const now = input.now ?? new Date();
  const context = await loadBookableContext(room.id, input.date, now);
  const discountPercent = therapistDiscountPercent(input.actor);
  const validated = validateInterval({
    room: context.room,
    date: input.date,
    start: input.start,
    end: input.end,
    settings: context.settings,
    openings: context.openings,
    blocks: context.blocks,
    bookings: context.bookings,
    now,
    discountPercent,
  });

  const inserted = await insertConfirmedBookingUnlessOccupied({
    roomId: context.room.id,
    userId: input.actor.id,
    createdByUserId: input.actor.id,
    startsAt: validated.startsAt,
    endsAt: validated.endsAt,
    roomName: context.room.name,
    baseHourlyRateMinor: validated.quote.baseHourlyRateMinor,
    discountPercent: validated.quote.discountPercent,
    effectiveHourlyRateMinor: validated.quote.effectiveHourlyRateMinor,
    durationMinutes: validated.quote.durationMinutes,
    amountMinor: validated.quote.amountMinor,
    actorUserId: input.actor.id,
    eventAction: "CREATED",
  });

  if (!inserted.ok) {
    if (inserted.reason === "missing") {
      throw new RoomError("notFound");
    }
    if (inserted.reason === "disabled") {
      throw new RoomError("disabledRoom");
    }
    if (inserted.reason === "block") {
      throw new RoomError("blocked");
    }
    throw new RoomError("slotConflict");
  }

  await recordAudit({
    actorUserId: input.actor.id,
    targetUserId: input.actor.id,
    action: AUDIT_ACTIONS.ROOM_BOOKING_CREATED,
    after: {
      bookingId: inserted.booking.id,
      roomId: inserted.booking.roomId,
      roomName: inserted.booking.roomName,
      startsAt: inserted.booking.startsAt.toISOString(),
      endsAt: inserted.booking.endsAt.toISOString(),
      durationMinutes: inserted.booking.durationMinutes,
      amountMinor: inserted.booking.amountMinor,
      currency: inserted.booking.currency,
      discountPercent: inserted.booking.discountPercent,
    },
  });

  return inserted.booking;
}
