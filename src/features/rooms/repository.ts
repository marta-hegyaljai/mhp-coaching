import {and, asc, count, desc, eq, gt, gte, inArray, isNull, lt, lte, ne, or, sql} from "drizzle-orm";
import type {SQL} from "drizzle-orm";

import {getDb, type Database} from "@/db";
import {
  roomBlocks,
  roomBookingEvents,
  roomBookingPrivateNotes,
  roomBookingSettings,
  roomBookings,
  roomOpeningIntervals,
  rooms,
  users,
  type Room,
  type RoomBlock,
  type RoomBooking,
  type RoomBookingEvent,
  type RoomBookingSettings,
  type RoomOpeningInterval,
  type User,
} from "@/db/schema";
import type {BookingEventAction} from "@/features/rooms/billing";
import {bookingHistorySnapshot} from "@/features/rooms/billing";
import type {EncryptedNote} from "@/features/rooms/note-crypto";
import {todayInZurich, zurichDayRange} from "@/features/rooms/timezone";

type RoomTx = Parameters<Parameters<Database["transaction"]>[0]>[0];

export const ADMIN_BOOKING_PAGE_SIZE = 25;

export async function listRooms(): Promise<Room[]> {
  return getDb().select().from(rooms).orderBy(asc(rooms.displayOrder), asc(rooms.name));
}

export async function findRoomById(id: string): Promise<Room | undefined> {
  const [row] = await getDb().select().from(rooms).where(eq(rooms.id, id)).limit(1);
  return row;
}

export async function nextRoomDisplayOrder(): Promise<number> {
  const [row] = await getDb()
    .select({value: sql<number>`coalesce(max(${rooms.displayOrder}), 0)`})
    .from(rooms);
  return Number(row?.value ?? 0) + 1;
}

export async function insertRoom(input: {
  name: string;
  description: string;
  hourlyRateMinor: number;
  displayOrder?: number;
  active?: boolean;
}): Promise<Room> {
  return getDb().transaction(async (tx) => {
    // Serialize creates so two admins cannot mint the same displayOrder.
    await tx.select({id: rooms.id}).from(rooms).for("update");
    const [maxRow] = await tx
      .select({value: sql<number>`coalesce(max(${rooms.displayOrder}), 0)`})
      .from(rooms);
    const [row] = await tx
      .insert(rooms)
      .values({
        name: input.name,
        description: input.description,
        hourlyRateMinor: input.hourlyRateMinor,
        displayOrder: input.displayOrder ?? Number(maxRow?.value ?? 0) + 1,
        active: input.active ?? true,
        currency: "CHF",
      })
      .returning();
    return row;
  });
}

export async function updateRoom(
  id: string,
  values: Partial<
    Pick<Room, "name" | "description" | "hourlyRateMinor" | "active" | "displayOrder">
  >,
): Promise<Room> {
  const [row] = await getDb()
    .update(rooms)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(rooms.id, id))
    .returning();
  return row;
}

export async function getBookingSettings(): Promise<RoomBookingSettings> {
  const [row] = await getDb()
    .select()
    .from(roomBookingSettings)
    .where(eq(roomBookingSettings.id, 1))
    .limit(1);

  if (!row) {
    throw new Error("Room booking settings are missing");
  }

  return row;
}

export async function updateBookingSettings(
  values: Partial<
    Pick<
      RoomBookingSettings,
      | "cancellationNoticeHours"
      | "bookingIntervalMinutes"
      | "minimumBookingMinutes"
      | "maximumBookingMinutes"
      | "maximumAdvanceBookingDays"
      | "reminderNoticeHours"
    >
  >,
): Promise<RoomBookingSettings> {
  const [row] = await getDb()
    .update(roomBookingSettings)
    .set({
      ...values,
      timezone: "Europe/Zurich",
      updatedAt: new Date(),
    })
    .where(eq(roomBookingSettings.id, 1))
    .returning();
  return row;
}

export async function replaceBookingConfiguration(input: {
  settings: Pick<
    RoomBookingSettings,
    | "cancellationNoticeHours"
    | "bookingIntervalMinutes"
    | "minimumBookingMinutes"
    | "maximumBookingMinutes"
    | "maximumAdvanceBookingDays"
    | "reminderNoticeHours"
  >;
  intervals: Array<{weekday: number; startMinute: number; endMinute: number}>;
}): Promise<{settings: RoomBookingSettings; hours: RoomOpeningInterval[]}> {
  return getDb().transaction(async (tx) => {
    const [settings] = await tx
      .update(roomBookingSettings)
      .set({
        ...input.settings,
        timezone: "Europe/Zurich",
        updatedAt: new Date(),
      })
      .where(eq(roomBookingSettings.id, 1))
      .returning();

    await tx.delete(roomOpeningIntervals);
    const hours =
      input.intervals.length === 0
        ? []
        : await tx.insert(roomOpeningIntervals).values(input.intervals).returning();

    return {settings, hours};
  });
}

export async function swapRoomDisplayOrder(
  first: {id: string; displayOrder: number},
  second: {id: string; displayOrder: number},
): Promise<void> {
  await getDb().transaction(async (tx) => {
    const locked = await tx
      .select()
      .from(rooms)
      .orderBy(asc(rooms.displayOrder), asc(rooms.name))
      .for("update");
    const currentFirst = locked.find((room) => room.id === first.id);
    const currentSecond = locked.find((room) => room.id === second.id);
    if (!currentFirst || !currentSecond) {
      return;
    }

    await tx
      .update(rooms)
      .set({displayOrder: currentSecond.displayOrder, updatedAt: new Date()})
      .where(eq(rooms.id, currentFirst.id));
    await tx
      .update(rooms)
      .set({displayOrder: currentFirst.displayOrder, updatedAt: new Date()})
      .where(eq(rooms.id, currentSecond.id));
  });
}

export async function listOpeningIntervals(): Promise<RoomOpeningInterval[]> {
  return getDb()
    .select()
    .from(roomOpeningIntervals)
    .orderBy(asc(roomOpeningIntervals.weekday), asc(roomOpeningIntervals.startMinute));
}

export async function replaceOpeningIntervals(
  intervals: Array<{weekday: number; startMinute: number; endMinute: number}>,
): Promise<RoomOpeningInterval[]> {
  return getDb().transaction(async (tx) => {
    await tx.delete(roomOpeningIntervals);
    if (intervals.length === 0) {
      return [];
    }
    return tx.insert(roomOpeningIntervals).values(intervals).returning();
  });
}

export async function listBlocksForRooms(
  roomIds: string[],
  from: Date,
  to: Date,
): Promise<RoomBlock[]> {
  if (roomIds.length === 0) {
    return [];
  }

  return getDb()
    .select()
    .from(roomBlocks)
    .where(
      and(
        inArray(roomBlocks.roomId, roomIds),
        lt(roomBlocks.startsAt, to),
        gt(roomBlocks.endsAt, from),
      ),
    )
    .orderBy(asc(roomBlocks.startsAt));
}

export async function listBlocksForRoom(roomId: string): Promise<RoomBlock[]> {
  return getDb()
    .select()
    .from(roomBlocks)
    .where(eq(roomBlocks.roomId, roomId))
    .orderBy(asc(roomBlocks.startsAt));
}

export async function insertBlock(input: {
  roomId: string;
  startsAt: Date;
  endsAt: Date;
  reason: string;
  createdByUserId: string;
}): Promise<RoomBlock> {
  const [row] = await getDb()
    .insert(roomBlocks)
    .values(input)
    .returning();
  return row;
}

/**
 * Locks the room row so a concurrent booking or second block cannot sneak in
 * between the overlap checks and the insert.
 */
export async function insertBlockUnlessOccupied(input: {
  roomId: string;
  startsAt: Date;
  endsAt: Date;
  reason: string;
  createdByUserId: string;
}): Promise<
  | {ok: true; block: RoomBlock}
  | {ok: false; reason: "booking"; bookings: RoomBooking[]}
  | {ok: false; reason: "block"}
> {
  return getDb().transaction(async (tx) => {
    const [room] = await tx
      .select({id: rooms.id})
      .from(rooms)
      .where(eq(rooms.id, input.roomId))
      .for("update");
    if (!room) {
      throw new Error("roomMissing");
    }

    const bookings = await tx
      .select()
      .from(roomBookings)
      .where(
        and(
          eq(roomBookings.roomId, input.roomId),
          eq(roomBookings.status, "CONFIRMED"),
          lt(roomBookings.startsAt, input.endsAt),
          gt(roomBookings.endsAt, input.startsAt),
        ),
      );
    if (bookings.length > 0) {
      return {ok: false as const, reason: "booking" as const, bookings};
    }

    const [existingBlock] = await tx
      .select({id: roomBlocks.id})
      .from(roomBlocks)
      .where(
        and(
          eq(roomBlocks.roomId, input.roomId),
          lt(roomBlocks.startsAt, input.endsAt),
          gt(roomBlocks.endsAt, input.startsAt),
        ),
      )
      .limit(1);
    if (existingBlock) {
      return {ok: false as const, reason: "block" as const};
    }

    const [block] = await tx.insert(roomBlocks).values(input).returning();
    return {ok: true as const, block};
  });
}

export async function deleteBlock(id: string): Promise<void> {
  await getDb().delete(roomBlocks).where(eq(roomBlocks.id, id));
}

export async function findBlockById(id: string): Promise<RoomBlock | undefined> {
  const [row] = await getDb().select().from(roomBlocks).where(eq(roomBlocks.id, id)).limit(1);
  return row;
}

export async function listConfirmedBookings(
  roomIds: string[],
  from: Date,
  to: Date,
  exceptBookingId?: string,
): Promise<RoomBooking[]> {
  if (roomIds.length === 0) {
    return [];
  }

  const filters = [
    inArray(roomBookings.roomId, roomIds),
    eq(roomBookings.status, "CONFIRMED"),
    lt(roomBookings.startsAt, to),
    gt(roomBookings.endsAt, from),
  ];
  if (exceptBookingId) {
    filters.push(ne(roomBookings.id, exceptBookingId));
  }

  return getDb()
    .select()
    .from(roomBookings)
    .where(and(...filters))
    .orderBy(asc(roomBookings.startsAt));
}

export async function insertConfirmedBooking(input: {
  roomId: string;
  userId: string;
  createdByUserId?: string;
  startsAt: Date;
  endsAt: Date;
  roomName: string;
  baseHourlyRateMinor: number;
  discountPercent: number;
  effectiveHourlyRateMinor: number;
  durationMinutes: number;
  amountMinor: number;
  currency?: "CHF";
}): Promise<RoomBooking> {
  const [row] = await getDb()
    .insert(roomBookings)
    .values({
      roomId: input.roomId,
      userId: input.userId,
      createdByUserId: input.createdByUserId ?? input.userId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: "CONFIRMED",
      roomName: input.roomName,
      baseHourlyRateMinor: input.baseHourlyRateMinor,
      discountPercent: input.discountPercent,
      effectiveHourlyRateMinor: input.effectiveHourlyRateMinor,
      durationMinutes: input.durationMinutes,
      amountMinor: input.amountMinor,
      currency: input.currency ?? "CHF",
      billingOutcome: "USAGE",
    })
    .returning();
  return row;
}

/**
 * Locks the room row so a concurrent reservation or block cannot sneak in
 * between the overlap checks and the insert.
 */
export async function insertConfirmedBookingUnlessOccupied(input: {
  roomId: string;
  userId: string;
  createdByUserId: string;
  startsAt: Date;
  endsAt: Date;
  roomName: string;
  baseHourlyRateMinor: number;
  discountPercent: number;
  effectiveHourlyRateMinor: number;
  durationMinutes: number;
  amountMinor: number;
  actorUserId?: string;
  eventAction?: Extract<BookingEventAction, "CREATED" | "ADMIN_CREATED">;
  exceptBookingId?: string;
  privateNote?: EncryptedNote & {ownerUserId: string};
}): Promise<
  | {ok: true; booking: RoomBooking}
  | {ok: false; reason: "missing"}
  | {ok: false; reason: "disabled"}
  | {ok: false; reason: "block"}
  | {ok: false; reason: "overlap"}
> {
  return getDb().transaction(async (tx) => {
    const occupancy = await assertRoomFreeForInsert(tx, {
      roomId: input.roomId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      exceptBookingId: input.exceptBookingId,
    });
    if (!occupancy.ok) {
      return occupancy;
    }

    try {
      const [booking] = await tx
        .insert(roomBookings)
        .values({
          roomId: input.roomId,
          userId: input.userId,
          createdByUserId: input.createdByUserId,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          status: "CONFIRMED",
          billingOutcome: "USAGE",
          roomName: input.roomName,
          baseHourlyRateMinor: input.baseHourlyRateMinor,
          discountPercent: input.discountPercent,
          effectiveHourlyRateMinor: input.effectiveHourlyRateMinor,
          durationMinutes: input.durationMinutes,
          amountMinor: input.amountMinor,
          currency: "CHF",
        })
        .returning();
      if (input.eventAction && input.actorUserId) {
        await insertBookingEvent(tx, {
          bookingId: booking.id,
          actorUserId: input.actorUserId,
          action: input.eventAction,
          before: null,
          after: bookingHistorySnapshot(booking),
        });
      }
      if (input.privateNote) {
        await tx.insert(roomBookingPrivateNotes).values({
          bookingId: booking.id,
          ownerUserId: input.privateNote.ownerUserId,
          ciphertext: input.privateNote.ciphertext,
          nonce: input.privateNote.nonce,
          keyVersion: input.privateNote.keyVersion,
        });
      }
      return {ok: true as const, booking};
    } catch (error) {
      if (isExclusionViolation(error)) {
        return {ok: false as const, reason: "overlap" as const};
      }
      throw error;
    }
  });
}

function isExclusionViolation(error: unknown): boolean {
  const codes = collectErrorCodes(error);
  if (codes.has("23P01")) {
    return true;
  }
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes("room_bookings_no_overlap");
}

function collectErrorCodes(error: unknown, seen = new Set<unknown>()): Set<string> {
  const codes = new Set<string>();
  if (!error || typeof error !== "object" || seen.has(error)) {
    return codes;
  }
  seen.add(error);
  if ("code" in error && typeof error.code === "string") {
    codes.add(error.code);
  }
  if ("cause" in error) {
    for (const code of collectErrorCodes(error.cause, seen)) {
      codes.add(code);
    }
  }
  return codes;
}

export async function listOwnBookings(userId: string): Promise<RoomBooking[]> {
  return getDb()
    .select()
    .from(roomBookings)
    .where(eq(roomBookings.userId, userId))
    .orderBy(asc(roomBookings.startsAt));
}

export type RoomBookingOwner = Pick<
  User,
  "id" | "firstName" | "lastName" | "email" | "roomDiscountPercent"
>;

export async function listRoomBookingsStartingInRange(input: {
  from: Date;
  toExclusive: Date;
  userId?: string;
}): Promise<Array<{booking: RoomBooking; owner: RoomBookingOwner}>> {
  const filters: SQL[] = [
    gte(roomBookings.startsAt, input.from),
    lt(roomBookings.startsAt, input.toExclusive),
  ];
  if (input.userId) {
    filters.push(eq(roomBookings.userId, input.userId));
  }

  const rows = await getDb()
    .select({
      booking: roomBookings,
      ownerId: users.id,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
      ownerEmail: users.email,
      ownerDiscount: users.roomDiscountPercent,
    })
    .from(roomBookings)
    .innerJoin(users, eq(roomBookings.userId, users.id))
    .where(and(...filters))
    .orderBy(asc(roomBookings.startsAt), asc(roomBookings.id));

  return rows.map((row) => ({
    booking: row.booking,
    owner: {
      id: row.ownerId,
      firstName: row.ownerFirstName,
      lastName: row.ownerLastName,
      email: row.ownerEmail,
      roomDiscountPercent: row.ownerDiscount,
    },
  }));
}

export async function findOwnBooking(
  userId: string,
  bookingId: string,
): Promise<RoomBooking | undefined> {
  const [row] = await getDb()
    .select()
    .from(roomBookings)
    .where(and(eq(roomBookings.id, bookingId), eq(roomBookings.userId, userId)))
    .limit(1);
  return row;
}

export async function overlappingConfirmedBookings(input: {
  roomId: string;
  startsAt: Date;
  endsAt: Date;
  exceptBookingId?: string;
}): Promise<RoomBooking[]> {
  const filters = [
    eq(roomBookings.roomId, input.roomId),
    eq(roomBookings.status, "CONFIRMED"),
    lt(roomBookings.startsAt, input.endsAt),
    gt(roomBookings.endsAt, input.startsAt),
  ];

  if (input.exceptBookingId) {
    filters.push(ne(roomBookings.id, input.exceptBookingId));
  }

  return getDb()
    .select()
    .from(roomBookings)
    .where(and(...filters));
}

export async function findBookingById(id: string): Promise<RoomBooking | undefined> {
  const [row] = await getDb().select().from(roomBookings).where(eq(roomBookings.id, id)).limit(1);
  return row;
}

export async function listUpcomingConfirmedBookings(input: {
  fromExclusive: Date;
  toInclusive: Date;
}): Promise<Array<{booking: RoomBooking; owner: User}>> {
  const rows = await getDb()
    .select({
      booking: roomBookings,
      owner: users,
    })
    .from(roomBookings)
    .innerJoin(users, eq(roomBookings.userId, users.id))
    .where(
      and(
        eq(roomBookings.status, "CONFIRMED"),
        gt(roomBookings.startsAt, input.fromExclusive),
        lte(roomBookings.startsAt, input.toInclusive),
      ),
    )
    .orderBy(asc(roomBookings.startsAt), asc(roomBookings.id));
  return rows;
}

export async function listBookingEvents(bookingId: string): Promise<RoomBookingEvent[]> {
  return getDb()
    .select()
    .from(roomBookingEvents)
    .where(eq(roomBookingEvents.bookingId, bookingId))
    .orderBy(asc(roomBookingEvents.createdAt), asc(roomBookingEvents.id));
}

export async function listRoomCapableUsers(): Promise<
  Array<Pick<User, "id" | "firstName" | "lastName" | "email" | "locale">>
> {
  return getDb()
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      locale: users.locale,
    })
    .from(users)
    .where(and(eq(users.roomBookingEnabled, true), isNull(users.disabledAt)))
    .orderBy(asc(users.lastName), asc(users.firstName), asc(users.emailNormalized));
}

export type AdminBookingListQuery = {
  q: string;
  status: "all" | "CONFIRMED" | "CANCELLED";
  page: number;
  pageSize?: number;
  /** Zurich `YYYY-MM-DD`. When set, only bookings overlapping that day. */
  day?: string;
  order?: "asc" | "desc";
};

export type AdminBookingMetrics = {
  today: number;
  confirmed: number;
  cancelled: number;
};

export type AdminBookingRow = {
  booking: RoomBooking;
  owner: Pick<User, "id" | "firstName" | "lastName" | "email">;
};

export async function listAdminBookingsPage(
  query: AdminBookingListQuery,
): Promise<{
  rows: AdminBookingRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}> {
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? ADMIN_BOOKING_PAGE_SIZE));
  const where = adminBookingWhere(query);
  const db = getDb();
  const [totalRow] = await db
    .select({value: count()})
    .from(roomBookings)
    .innerJoin(users, eq(roomBookings.userId, users.id))
    .where(where);
  const total = Number(totalRow?.value ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, query.page), pageCount);
  const offset = (page - 1) * pageSize;
  const startOrder = query.order === "asc" ? asc(roomBookings.startsAt) : desc(roomBookings.startsAt);
  const rows = await db
    .select({
      booking: roomBookings,
      ownerId: users.id,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
      ownerEmail: users.email,
    })
    .from(roomBookings)
    .innerJoin(users, eq(roomBookings.userId, users.id))
    .where(where)
    .orderBy(startOrder, desc(roomBookings.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    rows: rows.map((row) => ({
      booking: row.booking,
      owner: {
        id: row.ownerId,
        firstName: row.ownerFirstName,
        lastName: row.ownerLastName,
        email: row.ownerEmail,
      },
    })),
    total,
    page,
    pageSize,
    pageCount,
  };
}

export async function listAdminBookingMetrics(now = new Date()): Promise<AdminBookingMetrics> {
  const today = zurichDayRange(todayInZurich(now));
  const db = getDb();
  const [statusRows, todayRows] = await Promise.all([
    db
      .select({status: roomBookings.status, value: count()})
      .from(roomBookings)
      .groupBy(roomBookings.status),
    db
      .select({value: count()})
      .from(roomBookings)
      .where(
        and(
          eq(roomBookings.status, "CONFIRMED"),
          lt(roomBookings.startsAt, today.endExclusive),
          gt(roomBookings.endsAt, today.start),
        ),
      ),
  ]);

  const counts = {CONFIRMED: 0, CANCELLED: 0};
  for (const row of statusRows) {
    counts[row.status] = Number(row.value);
  }

  return {
    today: Number(todayRows[0]?.value ?? 0),
    confirmed: counts.CONFIRMED,
    cancelled: counts.CANCELLED,
  };
}

function adminBookingWhere(
  query: Pick<AdminBookingListQuery, "q" | "status" | "day">,
): SQL | undefined {
  const filters: SQL[] = [];
  const needle = query.q.trim().toLowerCase();
  if (needle) {
    const match = or(
      sql`position(${needle} in ${users.emailNormalized}) > 0`,
      sql`position(${needle} in lower(${users.email})) > 0`,
      sql`position(${needle} in lower(${users.firstName} || ' ' || ${users.lastName})) > 0`,
      sql`position(${needle} in lower(${roomBookings.roomName})) > 0`,
    );
    if (match) {
      filters.push(match);
    }
  }
  if (query.status !== "all") {
    filters.push(eq(roomBookings.status, query.status));
  }
  if (query.day) {
    const range = zurichDayRange(query.day);
    filters.push(lt(roomBookings.startsAt, range.endExclusive));
    filters.push(gt(roomBookings.endsAt, range.start));
  }
  if (filters.length === 0) {
    return undefined;
  }
  return filters.length === 1 ? filters[0] : and(...filters);
}

type OccupancyFailure =
  | {ok: false; reason: "missing"}
  | {ok: false; reason: "disabled"}
  | {ok: false; reason: "block"}
  | {ok: false; reason: "overlap"};

async function assertRoomFreeForInsert(
  tx: RoomTx,
  input: {roomId: string; startsAt: Date; endsAt: Date; exceptBookingId?: string},
): Promise<{ok: true} | OccupancyFailure> {
  const [room] = await tx
    .select({id: rooms.id, active: rooms.active})
    .from(rooms)
    .where(eq(rooms.id, input.roomId))
    .for("update");
  if (!room) {
    return {ok: false, reason: "missing"};
  }
  if (!room.active) {
    return {ok: false, reason: "disabled"};
  }

  const [block] = await tx
    .select({id: roomBlocks.id})
    .from(roomBlocks)
    .where(
      and(
        eq(roomBlocks.roomId, input.roomId),
        lt(roomBlocks.startsAt, input.endsAt),
        gt(roomBlocks.endsAt, input.startsAt),
      ),
    )
    .limit(1);
  if (block) {
    return {ok: false, reason: "block"};
  }

  const overlapFilters = [
    eq(roomBookings.roomId, input.roomId),
    eq(roomBookings.status, "CONFIRMED"),
    lt(roomBookings.startsAt, input.endsAt),
    gt(roomBookings.endsAt, input.startsAt),
  ];
  if (input.exceptBookingId) {
    overlapFilters.push(ne(roomBookings.id, input.exceptBookingId));
  }
  const [overlap] = await tx
    .select({id: roomBookings.id})
    .from(roomBookings)
    .where(and(...overlapFilters))
    .limit(1);
  if (overlap) {
    return {ok: false, reason: "overlap"};
  }
  return {ok: true};
}

async function lockBooking(tx: RoomTx, bookingId: string): Promise<RoomBooking | undefined> {
  const [row] = await tx
    .select()
    .from(roomBookings)
    .where(eq(roomBookings.id, bookingId))
    .for("update")
    .limit(1);
  return row;
}

async function insertBookingEvent(
  tx: RoomTx,
  input: {
    bookingId: string;
    actorUserId: string;
    action: BookingEventAction;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
  },
): Promise<void> {
  await tx.insert(roomBookingEvents).values(input);
}

export type ConfirmedBookingQuote = {
  roomName: string;
  baseHourlyRateMinor: number;
  discountPercent: number;
  effectiveHourlyRateMinor: number;
  durationMinutes: number;
  amountMinor: number;
};

export async function cancelConfirmedBooking(input: {
  bookingId: string;
  actorUserId: string;
  outcome: "FREE_CANCELLATION" | "LATE_CANCELLATION";
  now: Date;
  allowStarted: boolean;
}): Promise<
  | {ok: true; booking: RoomBooking}
  | {ok: false; reason: "missing"}
  | {ok: false; reason: "notConfirmed"}
  | {ok: false; reason: "started"}
> {
  return getDb().transaction(async (tx) => {
    const current = await lockBooking(tx, input.bookingId);
    if (!current) {
      return {ok: false as const, reason: "missing" as const};
    }
    await tx
      .select({id: rooms.id})
      .from(rooms)
      .where(eq(rooms.id, current.roomId))
      .for("update");
    if (current.status !== "CONFIRMED") {
      return {ok: false as const, reason: "notConfirmed" as const};
    }
    if (!input.allowStarted && current.startsAt.getTime() <= input.now.getTime()) {
      return {ok: false as const, reason: "started" as const};
    }

    const [booking] = await tx
      .update(roomBookings)
      .set({
        status: "CANCELLED",
        billingOutcome: input.outcome,
        cancelledAt: input.now,
        cancelledByUserId: input.actorUserId,
        updatedAt: input.now,
      })
      .where(eq(roomBookings.id, current.id))
      .returning();
    await insertBookingEvent(tx, {
      bookingId: booking.id,
      actorUserId: input.actorUserId,
      action: "CANCELLED",
      before: bookingHistorySnapshot(current),
      after: bookingHistorySnapshot(booking),
    });
    return {ok: true as const, booking};
  });
}

export async function updateConfirmedBookingUnlessOccupied(input: {
  bookingId: string;
  actorUserId: string;
  eventAction: Extract<BookingEventAction, "MOVED" | "ADMIN_MOVED">;
  roomId: string;
  startsAt: Date;
  endsAt: Date;
  quote: ConfirmedBookingQuote;
  now: Date;
}): Promise<
  | {ok: true; booking: RoomBooking; before: RoomBooking}
  | {ok: false; reason: "missing"}
  | {ok: false; reason: "notConfirmed"}
  | {ok: false; reason: "started"}
  | OccupancyFailure
> {
  return getDb().transaction(async (tx) => {
    const current = await lockBooking(tx, input.bookingId);
    if (!current) {
      return {ok: false as const, reason: "missing" as const};
    }
    const roomIds = [...new Set([current.roomId, input.roomId])].sort();
    for (const roomId of roomIds) {
      await tx.select({id: rooms.id}).from(rooms).where(eq(rooms.id, roomId)).for("update");
    }
    if (current.status !== "CONFIRMED") {
      return {ok: false as const, reason: "notConfirmed" as const};
    }
    if (current.startsAt.getTime() <= input.now.getTime()) {
      return {ok: false as const, reason: "started" as const};
    }

    const occupancy = await assertRoomFreeForInsert(tx, {
      roomId: input.roomId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      exceptBookingId: current.id,
    });
    if (!occupancy.ok) {
      return occupancy;
    }

    try {
      const [booking] = await tx
        .update(roomBookings)
        .set({
          roomId: input.roomId,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          roomName: input.quote.roomName,
          baseHourlyRateMinor: input.quote.baseHourlyRateMinor,
          discountPercent: input.quote.discountPercent,
          effectiveHourlyRateMinor: input.quote.effectiveHourlyRateMinor,
          durationMinutes: input.quote.durationMinutes,
          amountMinor: input.quote.amountMinor,
          updatedAt: input.now,
        })
        .where(eq(roomBookings.id, current.id))
        .returning();
      await insertBookingEvent(tx, {
        bookingId: booking.id,
        actorUserId: input.actorUserId,
        action: input.eventAction,
        before: bookingHistorySnapshot(current),
        after: bookingHistorySnapshot(booking),
      });
      return {ok: true as const, booking, before: current};
    } catch (error) {
      if (isExclusionViolation(error)) {
        return {ok: false as const, reason: "overlap" as const};
      }
      throw error;
    }
  });
}

export async function replaceConfirmedBookingUnlessOccupied(input: {
  bookingId: string;
  actorUserId: string;
  userId: string;
  roomId: string;
  startsAt: Date;
  endsAt: Date;
  quote: ConfirmedBookingQuote;
  now: Date;
}): Promise<
  | {ok: true; original: RoomBooking; booking: RoomBooking}
  | {ok: false; reason: "missing"}
  | {ok: false; reason: "notConfirmed"}
  | {ok: false; reason: "started"}
  | OccupancyFailure
> {
  return getDb().transaction(async (tx) => {
    const current = await lockBooking(tx, input.bookingId);
    if (!current) {
      return {ok: false as const, reason: "missing" as const};
    }
    const roomIds = [...new Set([current.roomId, input.roomId])].sort();
    for (const roomId of roomIds) {
      await tx.select({id: rooms.id}).from(rooms).where(eq(rooms.id, roomId)).for("update");
    }
    if (current.status !== "CONFIRMED") {
      return {ok: false as const, reason: "notConfirmed" as const};
    }
    if (current.startsAt.getTime() <= input.now.getTime()) {
      return {ok: false as const, reason: "started" as const};
    }

    const occupancy = await assertRoomFreeForInsert(tx, {
      roomId: input.roomId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      exceptBookingId: current.id,
    });
    if (!occupancy.ok) {
      return occupancy;
    }

    const [original] = await tx
      .update(roomBookings)
      .set({
        status: "CANCELLED",
        billingOutcome: "LATE_CANCELLATION",
        cancelledAt: input.now,
        cancelledByUserId: input.actorUserId,
        updatedAt: input.now,
      })
      .where(eq(roomBookings.id, current.id))
      .returning();

    try {
      const [booking] = await tx
        .insert(roomBookings)
        .values({
          roomId: input.roomId,
          userId: input.userId,
          createdByUserId: input.actorUserId,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          status: "CONFIRMED",
          billingOutcome: "USAGE",
          roomName: input.quote.roomName,
          baseHourlyRateMinor: input.quote.baseHourlyRateMinor,
          discountPercent: input.quote.discountPercent,
          effectiveHourlyRateMinor: input.quote.effectiveHourlyRateMinor,
          durationMinutes: input.quote.durationMinutes,
          amountMinor: input.quote.amountMinor,
          currency: "CHF",
        })
        .returning();

      const [linked] = await tx
        .update(roomBookings)
        .set({successorBookingId: booking.id, updatedAt: input.now})
        .where(eq(roomBookings.id, original.id))
        .returning();

      await insertBookingEvent(tx, {
        bookingId: linked.id,
        actorUserId: input.actorUserId,
        action: "CANCELLED",
        before: bookingHistorySnapshot(current),
        after: bookingHistorySnapshot(linked),
      });
      await insertBookingEvent(tx, {
        bookingId: booking.id,
        actorUserId: input.actorUserId,
        action: "CREATED",
        before: null,
        after: bookingHistorySnapshot(booking),
      });
      await tx
        .update(roomBookingPrivateNotes)
        .set({bookingId: booking.id, ownerUserId: input.userId, updatedAt: input.now})
        .where(eq(roomBookingPrivateNotes.bookingId, linked.id));
      return {ok: true as const, original: linked, booking};
    } catch (error) {
      if (isExclusionViolation(error)) {
        return {ok: false as const, reason: "overlap" as const};
      }
      throw error;
    }
  });
}

export async function waiveLateCancellationBooking(input: {
  bookingId: string;
  actorUserId: string;
  now: Date;
}): Promise<
  | {ok: true; booking: RoomBooking; before: RoomBooking}
  | {ok: false; reason: "missing"}
  | {ok: false; reason: "notWaivable"}
> {
  return getDb().transaction(async (tx) => {
    const current = await lockBooking(tx, input.bookingId);
    if (!current) {
      return {ok: false as const, reason: "missing" as const};
    }
    if (current.status !== "CANCELLED" || current.billingOutcome !== "LATE_CANCELLATION") {
      return {ok: false as const, reason: "notWaivable" as const};
    }

    const [booking] = await tx
      .update(roomBookings)
      .set({
        billingOutcome: "WAIVED",
        waivedAt: input.now,
        waivedByUserId: input.actorUserId,
        updatedAt: input.now,
      })
      .where(eq(roomBookings.id, current.id))
      .returning();
    await insertBookingEvent(tx, {
      bookingId: booking.id,
      actorUserId: input.actorUserId,
      action: "WAIVED",
      before: bookingHistorySnapshot(current),
      after: bookingHistorySnapshot(booking),
    });
    return {ok: true as const, booking, before: current};
  });
}
