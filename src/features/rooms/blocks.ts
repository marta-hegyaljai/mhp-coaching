import type {User} from "@/db/schema";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {canAdminister} from "@/features/auth/policy";
import {recordAudit} from "@/features/auth/repository";
import {RoomError} from "@/features/rooms/errors";
import {requireRoom} from "@/features/rooms/inventory";
import {
  deleteBlock,
  findBlockById,
  insertBlockUnlessOccupied,
} from "@/features/rooms/repository";
import {
  parseLocalDate,
  timeToMinutes,
  utcToZurich,
  zurichLocalToUtc,
} from "@/features/rooms/timezone";
import {isUuid} from "@/lib/uuid";

function requireAdmin(actor: User): void {
  if (!canAdminister(actor)) {
    throw new RoomError("forbidden");
  }
}

export function parseLocalDateTime(value: string): {date: string; time: string} {
  try {
    const normalized = value.trim().replace(" ", "T");
    const [date, timePart] = normalized.split("T");
    const time = (timePart ?? "").slice(0, 5);
    parseLocalDate(date);
    timeToMinutes(time);
    return {date, time};
  } catch {
    throw new RoomError("invalidTime");
  }
}

export function localDateTimeToUtc(date: string, time: string): Date {
  const converted = zurichLocalToUtc(date, time);
  if (!converted.ok) {
    throw new RoomError(converted.reason === "ambiguous" ? "ambiguousTime" : "invalidTime");
  }
  return converted.instant;
}

export async function createRoomBlock(input: {
  actor: User;
  roomId: string;
  startLocal: string;
  endLocal: string;
  reason: string;
}): Promise<void> {
  requireAdmin(input.actor);
  const room = await requireRoom(input.roomId);
  const start = parseLocalDateTime(input.startLocal);
  const end = parseLocalDateTime(input.endLocal);
  const startsAt = localDateTimeToUtc(start.date, start.time);
  const endsAt = localDateTimeToUtc(end.date, end.time);

  if (!(endsAt > startsAt)) {
    throw new RoomError("invalidRange");
  }

  const reason = input.reason.trim();
  if (reason.length < 1 || reason.length > 200) {
    throw new RoomError("invalidReason");
  }

  const inserted = await insertBlockUnlessOccupied({
    roomId: room.id,
    startsAt,
    endsAt,
    reason,
    createdByUserId: input.actor.id,
  });

  if (!inserted.ok) {
    if (inserted.reason === "block") {
      throw new RoomError("blockOverlap");
    }
    throw new RoomError(
      "blockConflict",
      inserted.bookings.map((booking) => ({
        bookingId: booking.id,
        roomId: booking.roomId,
        startsAt: booking.startsAt.toISOString(),
        endsAt: booking.endsAt.toISOString(),
      })),
    );
  }

  const block = inserted.block;

  await recordAudit({
    actorUserId: input.actor.id,
    action: AUDIT_ACTIONS.ROOM_BLOCK_CREATED,
    after: {
      blockId: block.id,
      roomId: room.id,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      reason,
    },
  });
}

export async function removeRoomBlock(input: {
  actor: User;
  blockId: string;
}): Promise<void> {
  requireAdmin(input.actor);
  if (!isUuid(input.blockId)) {
    throw new RoomError("notFound");
  }
  const block = await findBlockById(input.blockId);
  if (!block) {
    throw new RoomError("notFound");
  }
  await deleteBlock(block.id);
  await recordAudit({
    actorUserId: input.actor.id,
    action: AUDIT_ACTIONS.ROOM_BLOCK_REMOVED,
    before: {
      blockId: block.id,
      roomId: block.roomId,
      startsAt: block.startsAt.toISOString(),
      endsAt: block.endsAt.toISOString(),
      reason: block.reason,
    },
  });
}

export function blockLocalLabel(startsAt: Date, endsAt: Date): string {
  const start = utcToZurich(startsAt);
  const end = utcToZurich(endsAt);
  return `${start.date} ${start.time} – ${end.date} ${end.time}`;
}
