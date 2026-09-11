import {and, count, desc, eq, sql} from "drizzle-orm";
import type {SQL} from "drizzle-orm";

import {getDb} from "@/db";
import {
  roomAvailabilityRequests,
  rooms,
  users,
  type RoomAvailabilityRequest,
  type RoomAvailabilityRequestStatus,
  type User,
} from "@/db/schema";
import {canAccessRooms, canAdminister} from "@/features/auth/policy";
import {isUniqueViolation} from "@/features/auth/unique-email";
import {RoomError} from "@/features/rooms/errors";
import {REQUEST_MESSAGE_MAX_LENGTH} from "@/features/rooms/limits";
import {requireRoom} from "@/features/rooms/inventory";
import {validateBookableInterval} from "@/features/rooms/reservations";
import {listRooms} from "@/features/rooms/repository";
import {getBookingSettings} from "@/features/rooms/settings";
import {
  parseLocalDate,
  sameZurichDay,
  timeToMinutes,
  zurichLocalToUtc,
} from "@/features/rooms/timezone";
import {sanitizeVisibleText} from "@/features/rooms/visible-text";
import {isUuid} from "@/lib/uuid";

export const ADMIN_REQUEST_PAGE_SIZE = 25;
export const OPEN_REQUEST_SLOT_UNIQUE = "room_availability_requests_open_slot_uidx";

export type TherapistRequest = {
  id: string;
  preferredRoomId: string | null;
  preferredRoomName: string | null;
  startsAt: string;
  endsAt: string;
  message: string | null;
  status: RoomAvailabilityRequestStatus;
  createdAt: string;
  resolvedAt: string | null;
};

export type AdminRequest = TherapistRequest & {
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  adminNote: string | null;
  resolvedByUserId: string | null;
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

function instantFor(date: string, time: string): Date {
  try {
    parseLocalDate(date);
    timeToMinutes(time);
  } catch {
    throw new RoomError("invalidTime");
  }
  const converted = zurichLocalToUtc(date, time);
  if (!converted.ok) {
    throw new RoomError(converted.reason === "ambiguous" ? "ambiguousTime" : "invalidTime");
  }
  return converted.instant;
}

function alignedToInterval(minute: number, interval: number): boolean {
  return minute % interval === 0;
}

export async function validateRequestInterval(input: {
  date: string;
  start: string;
  end: string;
  now?: Date;
}): Promise<{startsAt: Date; endsAt: Date}> {
  const settings = await getBookingSettings();
  const startsAt = instantFor(input.date, input.start);
  const endsAt = instantFor(input.date, input.end);
  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new RoomError("invalidRange");
  }
  if (!sameZurichDay(startsAt, endsAt)) {
    throw new RoomError("invalidRange");
  }

  const startMinute = timeToMinutes(input.start);
  const endMinute = timeToMinutes(input.end);
  if (
    !alignedToInterval(startMinute, settings.bookingIntervalMinutes) ||
    !alignedToInterval(endMinute, settings.bookingIntervalMinutes)
  ) {
    throw new RoomError("invalidIncrement");
  }

  const duration = (endsAt.getTime() - startsAt.getTime()) / 60_000;
  if (duration < settings.minimumBookingMinutes) {
    throw new RoomError("invalidDuration");
  }
  if (settings.maximumBookingMinutes !== null && duration > settings.maximumBookingMinutes) {
    throw new RoomError("invalidDuration");
  }

  const now = input.now ?? new Date();
  if (startsAt.getTime() <= now.getTime()) {
    throw new RoomError("tooSoon");
  }

  return {startsAt, endsAt};
}

async function isRoomBookable(input: {
  actor: User;
  roomId: string;
  date: string;
  start: string;
  end: string;
  now: Date;
}): Promise<boolean> {
  try {
    await validateBookableInterval({
      roomId: input.roomId,
      date: input.date,
      start: input.start,
      end: input.end,
      now: input.now,
      allowPast: true,
    });
    return true;
  } catch (error) {
    if (error instanceof RoomError) {
      return false;
    }
    throw error;
  }
}

async function assertIntervalUnavailable(input: {
  actor: User;
  preferredRoomId: string | null;
  date: string;
  start: string;
  end: string;
  now: Date;
}): Promise<void> {
  if (input.preferredRoomId) {
    const room = await requireRoom(input.preferredRoomId);
    const bookable = room.active
      ? await isRoomBookable({
          actor: input.actor,
          roomId: room.id,
          date: input.date,
          start: input.start,
          end: input.end,
          now: input.now,
        })
      : false;
    if (bookable) {
      throw new RoomError("slotAvailable");
    }
    return;
  }

  const inventory = (await listRooms()).filter((room) => room.active);
  for (const room of inventory) {
    if (
      await isRoomBookable({
        actor: input.actor,
        roomId: room.id,
        date: input.date,
        start: input.start,
        end: input.end,
        now: input.now,
      })
    ) {
      throw new RoomError("slotAvailable");
    }
  }
}

function toTherapistRequest(
  row: RoomAvailabilityRequest,
  roomName: string | null,
): TherapistRequest {
  return {
    id: row.id,
    preferredRoomId: row.preferredRoomId,
    preferredRoomName: roomName,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    message: row.message,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
  };
}

export async function createAvailabilityRequest(input: {
  actor: User;
  date: string;
  start: string;
  end: string;
  preferredRoomId?: string;
  message?: string;
  now?: Date;
}): Promise<TherapistRequest> {
  requireTherapist(input.actor);
  const now = input.now ?? new Date();
  const preferredRoomId = input.preferredRoomId?.trim()
    ? input.preferredRoomId.trim()
    : null;
  if (preferredRoomId && !isUuid(preferredRoomId)) {
    throw new RoomError("notFound");
  }
  const preferredRoom = preferredRoomId ? await requireRoom(preferredRoomId) : null;
  const message = input.message
    ? sanitizeVisibleText(input.message, REQUEST_MESSAGE_MAX_LENGTH, "invalidMessage", {
        allowEmpty: true,
      })
    : "";
  const {startsAt, endsAt} = await validateRequestInterval({
    date: input.date,
    start: input.start,
    end: input.end,
    now,
  });
  await assertIntervalUnavailable({
    actor: input.actor,
    preferredRoomId: preferredRoom?.id ?? null,
    date: input.date,
    start: input.start,
    end: input.end,
    now,
  });

  const existing = await findOpenRequestForSlot({
    userId: input.actor.id,
    startsAt,
    endsAt,
    preferredRoomId: preferredRoom?.id ?? null,
  });
  if (existing) {
    return toTherapistRequest(existing, preferredRoom?.name ?? null);
  }

  try {
    const [row] = await getDb()
      .insert(roomAvailabilityRequests)
      .values({
        userId: input.actor.id,
        preferredRoomId: preferredRoom?.id ?? null,
        startsAt,
        endsAt,
        message: message || null,
        status: "OPEN",
      })
      .returning();

    return toTherapistRequest(row, preferredRoom?.name ?? null);
  } catch (error) {
    if (isUniqueViolation(error, OPEN_REQUEST_SLOT_UNIQUE)) {
      const raced = await findOpenRequestForSlot({
        userId: input.actor.id,
        startsAt,
        endsAt,
        preferredRoomId: preferredRoom?.id ?? null,
      });
      if (raced) {
        return toTherapistRequest(raced, preferredRoom?.name ?? null);
      }
    }
    throw error;
  }
}

async function findOpenRequestForSlot(input: {
  userId: string;
  startsAt: Date;
  endsAt: Date;
  preferredRoomId: string | null;
}) {
  const [row] = await getDb()
    .select()
    .from(roomAvailabilityRequests)
    .where(
      and(
        eq(roomAvailabilityRequests.userId, input.userId),
        eq(roomAvailabilityRequests.status, "OPEN"),
        eq(roomAvailabilityRequests.startsAt, input.startsAt),
        eq(roomAvailabilityRequests.endsAt, input.endsAt),
        input.preferredRoomId
          ? eq(roomAvailabilityRequests.preferredRoomId, input.preferredRoomId)
          : sql`${roomAvailabilityRequests.preferredRoomId} is null`,
      ),
    )
    .limit(1);
  return row;
}

export async function listMyAvailabilityRequests(actor: User): Promise<TherapistRequest[]> {
  requireTherapist(actor);
  const rows = await getDb()
    .select({
      request: roomAvailabilityRequests,
      roomName: rooms.name,
    })
    .from(roomAvailabilityRequests)
    .leftJoin(rooms, eq(roomAvailabilityRequests.preferredRoomId, rooms.id))
    .where(eq(roomAvailabilityRequests.userId, actor.id))
    .orderBy(
      sql`case when ${roomAvailabilityRequests.status} = 'OPEN' then 0 else 1 end`,
      desc(roomAvailabilityRequests.createdAt),
    );

  return rows.map((row) => toTherapistRequest(row.request, row.roomName));
}

export async function getMyAvailabilityRequest(
  actor: User,
  requestId: string,
): Promise<TherapistRequest> {
  requireTherapist(actor);
  if (!isUuid(requestId)) {
    throw new RoomError("notFound");
  }
  const [row] = await getDb()
    .select({
      request: roomAvailabilityRequests,
      roomName: rooms.name,
    })
    .from(roomAvailabilityRequests)
    .leftJoin(rooms, eq(roomAvailabilityRequests.preferredRoomId, rooms.id))
    .where(
      and(
        eq(roomAvailabilityRequests.id, requestId),
        eq(roomAvailabilityRequests.userId, actor.id),
      ),
    )
    .limit(1);
  if (!row) {
    throw new RoomError("notFound");
  }
  return toTherapistRequest(row.request, row.roomName);
}

export async function withdrawAvailabilityRequest(
  actor: User,
  requestId: string,
): Promise<void> {
  const request = await getMyAvailabilityRequest(actor, requestId);
  if (request.status !== "OPEN") {
    throw new RoomError("notOpen");
  }
  await getDb()
    .delete(roomAvailabilityRequests)
    .where(
      and(
        eq(roomAvailabilityRequests.id, request.id),
        eq(roomAvailabilityRequests.userId, actor.id),
        eq(roomAvailabilityRequests.status, "OPEN"),
      ),
    );
}

function toAdminRequest(
  row: RoomAvailabilityRequest,
  roomName: string | null,
  owner: AdminRequest["owner"],
): AdminRequest {
  return {
    ...toTherapistRequest(row, roomName),
    owner,
    adminNote: row.adminNote,
    resolvedByUserId: row.resolvedByUserId,
  };
}

export type AdminRequestListQuery = {
  q: string;
  status: "all" | RoomAvailabilityRequestStatus;
  page: number;
  pageSize?: number;
};

export async function listAdminAvailabilityRequests(
  actor: User,
  query: AdminRequestListQuery,
): Promise<{
  rows: AdminRequest[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}> {
  requireAdmin(actor);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? ADMIN_REQUEST_PAGE_SIZE));
  const filters: SQL[] = [];
  const needle = query.q.trim().toLowerCase();
  if (needle) {
    const match = sql`(
      position(${needle} in ${users.emailNormalized}) > 0
      or position(${needle} in lower(${users.email})) > 0
      or position(${needle} in lower(${users.firstName} || ' ' || ${users.lastName})) > 0
      or position(${needle} in lower(coalesce(${rooms.name}, ''))) > 0
    )`;
    filters.push(match);
  }
  if (query.status !== "all") {
    filters.push(eq(roomAvailabilityRequests.status, query.status));
  }
  const where = filters.length === 0 ? undefined : and(...filters);
  const db = getDb();
  const [totalRow] = await db
    .select({value: count()})
    .from(roomAvailabilityRequests)
    .innerJoin(users, eq(roomAvailabilityRequests.userId, users.id))
    .leftJoin(rooms, eq(roomAvailabilityRequests.preferredRoomId, rooms.id))
    .where(where);
  const total = Number(totalRow?.value ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, query.page), pageCount);
  const offset = (page - 1) * pageSize;
  const rows = await db
    .select({
      request: roomAvailabilityRequests,
      roomName: rooms.name,
      ownerId: users.id,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
      ownerEmail: users.email,
    })
    .from(roomAvailabilityRequests)
    .innerJoin(users, eq(roomAvailabilityRequests.userId, users.id))
    .leftJoin(rooms, eq(roomAvailabilityRequests.preferredRoomId, rooms.id))
    .where(where)
    .orderBy(
      sql`case when ${roomAvailabilityRequests.status} = 'OPEN' then 0 else 1 end`,
      desc(roomAvailabilityRequests.createdAt),
    )
    .limit(pageSize)
    .offset(offset);

  return {
    rows: rows.map((row) =>
      toAdminRequest(row.request, row.roomName, {
        id: row.ownerId,
        firstName: row.ownerFirstName,
        lastName: row.ownerLastName,
        email: row.ownerEmail,
      }),
    ),
    total,
    page,
    pageSize,
    pageCount,
  };
}

export async function getAdminAvailabilityRequest(
  actor: User,
  requestId: string,
): Promise<AdminRequest> {
  requireAdmin(actor);
  if (!isUuid(requestId)) {
    throw new RoomError("notFound");
  }
  const [row] = await getDb()
    .select({
      request: roomAvailabilityRequests,
      roomName: rooms.name,
      ownerId: users.id,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
      ownerEmail: users.email,
    })
    .from(roomAvailabilityRequests)
    .innerJoin(users, eq(roomAvailabilityRequests.userId, users.id))
    .leftJoin(rooms, eq(roomAvailabilityRequests.preferredRoomId, rooms.id))
    .where(eq(roomAvailabilityRequests.id, requestId))
    .limit(1);
  if (!row) {
    throw new RoomError("notFound");
  }
  return toAdminRequest(row.request, row.roomName, {
    id: row.ownerId,
    firstName: row.ownerFirstName,
    lastName: row.ownerLastName,
    email: row.ownerEmail,
  });
}

export async function resolveAvailabilityRequest(input: {
  actor: User;
  requestId: string;
  decision: "RESOLVED" | "DECLINED";
  adminNote?: string;
  now?: Date;
}): Promise<AdminRequest> {
  requireAdmin(input.actor);
  if (!isUuid(input.requestId)) {
    throw new RoomError("notFound");
  }
  const adminNote = input.adminNote
    ? sanitizeVisibleText(input.adminNote, REQUEST_MESSAGE_MAX_LENGTH, "invalidAdminNote", {
        allowEmpty: true,
      })
    : "";
  const now = input.now ?? new Date();

  return getDb().transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(roomAvailabilityRequests)
      .where(eq(roomAvailabilityRequests.id, input.requestId))
      .for("update")
      .limit(1);
    if (!current) {
      throw new RoomError("notFound");
    }
    if (current.status !== "OPEN") {
      throw new RoomError("alreadyResolved");
    }

    const [updated] = await tx
      .update(roomAvailabilityRequests)
      .set({
        status: input.decision,
        adminNote: adminNote || null,
        resolvedAt: now,
        resolvedByUserId: input.actor.id,
        updatedAt: now,
      })
      .where(eq(roomAvailabilityRequests.id, current.id))
      .returning();

    const [owner] = await tx
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, updated.userId))
      .limit(1);
    if (!owner) {
      throw new RoomError("notFound");
    }
    const roomName = updated.preferredRoomId
      ? (
          await tx
            .select({name: rooms.name})
            .from(rooms)
            .where(eq(rooms.id, updated.preferredRoomId))
            .limit(1)
        )[0]?.name ?? null
      : null;
    return toAdminRequest(updated, roomName, owner);
  });
}
