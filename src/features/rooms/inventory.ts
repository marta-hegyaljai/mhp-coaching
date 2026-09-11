import type {User} from "@/db/schema";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {canAdminister} from "@/features/auth/policy";
import {recordAudit} from "@/features/auth/repository";
import {francsToMinorUnits} from "@/features/payments/money";
import {RoomError} from "@/features/rooms/errors";
import {
  findRoomById,
  insertRoom,
  listRooms,
  swapRoomDisplayOrder,
  updateRoom,
} from "@/features/rooms/repository";
import {isUuid} from "@/lib/uuid";

function requireAdmin(actor: User): void {
  if (!canAdminister(actor)) {
    throw new RoomError("forbidden");
  }
}

function requireName(value: string): string {
  const name = value.trim();
  if (name.length < 1 || name.length > 80) {
    throw new RoomError("invalidName");
  }
  return name;
}

function requireDescription(value: string): string {
  const description = value.trim();
  if (description.length > 2000) {
    throw new RoomError("invalidDescription");
  }
  return description;
}

function requireRateMinor(value: number): number {
  if (!Number.isInteger(value) || value <= 0 || value > 10_000_000) {
    throw new RoomError("invalidPrice");
  }
  return value;
}

export function parseHourlyRateInput(raw: string): number {
  const trimmed = raw.trim().replace(",", ".");
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new RoomError("invalidPrice");
  }
  try {
    return requireRateMinor(francsToMinorUnits(amount));
  } catch {
    throw new RoomError("invalidPrice");
  }
}

function snapshot(room: {
  id: string;
  name: string;
  hourlyRateMinor: number;
  active: boolean;
  displayOrder: number;
}) {
  return {
    roomId: room.id,
    name: room.name,
    hourlyRateMinor: room.hourlyRateMinor,
    active: room.active,
    displayOrder: room.displayOrder,
  };
}

export async function createRoom(input: {
  actor: User;
  name: string;
  description: string;
  hourlyRateMinor: number;
}): Promise<{id: string}> {
  requireAdmin(input.actor);
  const room = await insertRoom({
    name: requireName(input.name),
    description: requireDescription(input.description),
    hourlyRateMinor: requireRateMinor(input.hourlyRateMinor),
  });
  await recordAudit({
    actorUserId: input.actor.id,
    action: AUDIT_ACTIONS.ROOM_CREATED,
    after: snapshot(room),
  });
  return {id: room.id};
}

export async function editRoom(input: {
  actor: User;
  roomId: string;
  name: string;
  description: string;
  hourlyRateMinor: number;
}): Promise<void> {
  requireAdmin(input.actor);
  const room = await requireRoom(input.roomId);
  const updated = await updateRoom(room.id, {
    name: requireName(input.name),
    description: requireDescription(input.description),
    hourlyRateMinor: requireRateMinor(input.hourlyRateMinor),
  });
  await recordAudit({
    actorUserId: input.actor.id,
    action: AUDIT_ACTIONS.ROOM_UPDATED,
    before: snapshot(room),
    after: snapshot(updated),
  });
}

export async function setRoomActive(input: {
  actor: User;
  roomId: string;
  active: boolean;
}): Promise<void> {
  requireAdmin(input.actor);
  const room = await requireRoom(input.roomId);
  if (room.active === input.active) {
    return;
  }
  const updated = await updateRoom(room.id, {active: input.active});
  await recordAudit({
    actorUserId: input.actor.id,
    action: input.active ? AUDIT_ACTIONS.ROOM_ENABLED : AUDIT_ACTIONS.ROOM_DISABLED,
    before: snapshot(room),
    after: snapshot(updated),
  });
}

export async function moveRoom(input: {
  actor: User;
  roomId: string;
  direction: "up" | "down";
}): Promise<void> {
  requireAdmin(input.actor);
  const room = await requireRoom(input.roomId);
  const ordered = await listRooms();
  const index = ordered.findIndex((item) => item.id === room.id);
  const swapWith = input.direction === "up" ? ordered[index - 1] : ordered[index + 1];
  if (!swapWith) {
    return;
  }

  await swapRoomDisplayOrder(room, swapWith);
  await recordAudit({
    actorUserId: input.actor.id,
    action: AUDIT_ACTIONS.ROOM_REORDERED,
    before: {roomId: room.id, displayOrder: room.displayOrder},
    after: {roomId: room.id, displayOrder: swapWith.displayOrder},
  });
}

export async function requireRoom(roomId: string) {
  if (!isUuid(roomId)) {
    throw new RoomError("notFound");
  }
  const room = await findRoomById(roomId);
  if (!room) {
    throw new RoomError("notFound");
  }
  return room;
}

export {listRooms};
