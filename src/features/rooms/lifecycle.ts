import type {RoomBooking, User} from "@/db/schema";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {canAccessRooms, canAdminister} from "@/features/auth/policy";
import {findUserById, recordAudit} from "@/features/auth/repository";
import {
  auditBookingSnapshot,
  cancellationOutcome,
  isFreeCancellation,
} from "@/features/rooms/billing";
import {RoomError} from "@/features/rooms/errors";
import {therapistDiscountPercent} from "@/features/rooms/pricing";
import {
  cancelConfirmedBooking,
  findBookingById,
  insertConfirmedBookingUnlessOccupied,
  replaceConfirmedBookingUnlessOccupied,
  updateConfirmedBookingUnlessOccupied,
  waiveLateCancellationBooking,
} from "@/features/rooms/repository";
import {validateBookableInterval} from "@/features/rooms/reservations";
import {getBookingSettings} from "@/features/rooms/settings";
import {isUuid} from "@/lib/uuid";

export function ownerCanMutateBooking(booking: RoomBooking, now = new Date()): boolean {
  return booking.status === "CONFIRMED" && booking.startsAt.getTime() > now.getTime();
}

export function adminCanCancelBooking(booking: RoomBooking): boolean {
  return booking.status === "CONFIRMED";
}

export function adminCanWaiveBooking(booking: RoomBooking): boolean {
  return booking.status === "CANCELLED" && booking.billingOutcome === "LATE_CANCELLATION";
}

function requireAdmin(actor: User): void {
  if (!canAdminister(actor)) {
    throw new RoomError("forbidden");
  }
}

async function loadVisibleBooking(
  actor: User,
  bookingId: string,
): Promise<{booking: RoomBooking; admin: boolean}> {
  if (!isUuid(bookingId)) {
    throw new RoomError("notFound");
  }
  const booking = await findBookingById(bookingId);
  if (!booking) {
    throw new RoomError("notFound");
  }
  if (canAdminister(actor)) {
    return {booking, admin: true};
  }
  if (!canAccessRooms(actor)) {
    throw new RoomError("forbidden");
  }
  if (booking.userId !== actor.id) {
    throw new RoomError("notFound");
  }
  return {booking, admin: false};
}

function mapOccupancy(reason: "missing" | "disabled" | "block" | "overlap"): never {
  if (reason === "missing") {
    throw new RoomError("notFound");
  }
  if (reason === "disabled") {
    throw new RoomError("disabledRoom");
  }
  if (reason === "block") {
    throw new RoomError("blocked");
  }
  throw new RoomError("slotConflict");
}

function mapMutationFailure(
  reason: "missing" | "notConfirmed" | "started" | "disabled" | "block" | "overlap",
): never {
  if (reason === "notConfirmed") {
    throw new RoomError("alreadyCancelled");
  }
  if (reason === "started") {
    throw new RoomError("tooLateToChange");
  }
  return mapOccupancy(reason);
}

async function validateSlotForUser(input: {
  user: User;
  roomId: string;
  date: string;
  start: string;
  end: string;
  now: Date;
  exceptBookingId?: string;
}) {
  return validateBookableInterval({
    roomId: input.roomId,
    date: input.date,
    start: input.start,
    end: input.end,
    now: input.now,
    exceptBookingId: input.exceptBookingId,
    discountPercent: therapistDiscountPercent(input.user),
  });
}

export async function cancelRoomBooking(input: {
  actor: User;
  bookingId: string;
  now?: Date;
}): Promise<RoomBooking> {
  const now = input.now ?? new Date();
  const {booking, admin} = await loadVisibleBooking(input.actor, input.bookingId);
  if (!admin && !canAccessRooms(input.actor)) {
    throw new RoomError("forbidden");
  }
  if (!admin && booking.userId !== input.actor.id) {
    throw new RoomError("notFound");
  }
  if (!admin && !ownerCanMutateBooking(booking, now)) {
    throw new RoomError(booking.status === "CANCELLED" ? "alreadyCancelled" : "tooLateToChange");
  }
  if (admin && !adminCanCancelBooking(booking)) {
    throw new RoomError(booking.status === "CANCELLED" ? "alreadyCancelled" : "notCancellable");
  }

  const settings = await getBookingSettings();
  const outcome = cancellationOutcome(booking.startsAt, now, settings.cancellationNoticeHours);
  const cancelled = await cancelConfirmedBooking({
    bookingId: booking.id,
    actorUserId: input.actor.id,
    outcome,
    now,
    allowStarted: admin,
  });
  if (!cancelled.ok) {
    mapMutationFailure(cancelled.reason);
  }

  await recordAudit({
    actorUserId: input.actor.id,
    targetUserId: cancelled.booking.userId,
    action: AUDIT_ACTIONS.ROOM_BOOKING_CANCELLED,
    before: auditBookingSnapshot(booking),
    after: auditBookingSnapshot(cancelled.booking),
  });
  return cancelled.booking;
}

export type MovedRoomBooking =
  | {kind: "moved"; booking: RoomBooking}
  | {kind: "replaced"; original: RoomBooking; booking: RoomBooking};

export async function moveRoomBooking(input: {
  actor: User;
  bookingId: string;
  roomId: string;
  date: string;
  start: string;
  end: string;
  now?: Date;
}): Promise<MovedRoomBooking> {
  const now = input.now ?? new Date();
  const {booking, admin} = await loadVisibleBooking(input.actor, input.bookingId);
  if (!ownerCanMutateBooking(booking, now)) {
    throw new RoomError(booking.status === "CANCELLED" ? "alreadyCancelled" : "tooLateToChange");
  }

  const owner = admin ? await requireRoomUser(booking.userId) : input.actor;
  const validated = await validateSlotForUser({
    user: owner,
    roomId: input.roomId,
    date: input.date,
    start: input.start,
    end: input.end,
    now,
    exceptBookingId: booking.id,
  });

  if (
    validated.room.id === booking.roomId &&
    validated.startsAt.getTime() === booking.startsAt.getTime() &&
    validated.endsAt.getTime() === booking.endsAt.getTime()
  ) {
    return {kind: "moved", booking};
  }

  const settings = await getBookingSettings();
  const lateForOwner = !admin && !isFreeCancellation(
    booking.startsAt,
    now,
    settings.cancellationNoticeHours,
  );
  const quote = {
    roomName: validated.room.name,
    baseHourlyRateMinor: validated.quote.baseHourlyRateMinor,
    discountPercent: validated.quote.discountPercent,
    effectiveHourlyRateMinor: validated.quote.effectiveHourlyRateMinor,
    durationMinutes: validated.quote.durationMinutes,
    amountMinor: validated.quote.amountMinor,
  };

  if (lateForOwner) {
    const replaced = await replaceConfirmedBookingUnlessOccupied({
      bookingId: booking.id,
      actorUserId: input.actor.id,
      userId: booking.userId,
      roomId: validated.room.id,
      startsAt: validated.startsAt,
      endsAt: validated.endsAt,
      quote,
      now,
    });
    if (!replaced.ok) {
      mapMutationFailure(replaced.reason);
    }
    await recordAudit({
      actorUserId: input.actor.id,
      targetUserId: booking.userId,
      action: AUDIT_ACTIONS.ROOM_BOOKING_CANCELLED,
      before: auditBookingSnapshot(booking),
      after: auditBookingSnapshot(replaced.original),
    });
    await recordAudit({
      actorUserId: input.actor.id,
      targetUserId: booking.userId,
      action: AUDIT_ACTIONS.ROOM_BOOKING_CREATED,
      after: auditBookingSnapshot(replaced.booking),
    });
    return {kind: "replaced", original: replaced.original, booking: replaced.booking};
  }

  const moved = await updateConfirmedBookingUnlessOccupied({
    bookingId: booking.id,
    actorUserId: input.actor.id,
    eventAction: admin ? "ADMIN_MOVED" : "MOVED",
    roomId: validated.room.id,
    startsAt: validated.startsAt,
    endsAt: validated.endsAt,
    quote,
    now,
  });
  if (!moved.ok) {
    mapMutationFailure(moved.reason);
  }
  await recordAudit({
    actorUserId: input.actor.id,
    targetUserId: booking.userId,
    action: admin ? AUDIT_ACTIONS.ROOM_BOOKING_ADMIN_MOVED : AUDIT_ACTIONS.ROOM_BOOKING_UPDATED,
    before: auditBookingSnapshot(moved.before),
    after: auditBookingSnapshot(moved.booking),
  });
  return {kind: "moved", booking: moved.booking};
}

export async function createRoomBookingForUser(input: {
  actor: User;
  userId: string;
  roomId: string;
  date: string;
  start: string;
  end: string;
  now?: Date;
}): Promise<RoomBooking> {
  requireAdmin(input.actor);
  const now = input.now ?? new Date();
  const user = await requireRoomUser(input.userId);
  const validated = await validateSlotForUser({
    user,
    roomId: input.roomId,
    date: input.date,
    start: input.start,
    end: input.end,
    now,
  });

  const inserted = await insertConfirmedBookingUnlessOccupied({
    roomId: validated.room.id,
    userId: user.id,
    createdByUserId: input.actor.id,
    startsAt: validated.startsAt,
    endsAt: validated.endsAt,
    roomName: validated.room.name,
    baseHourlyRateMinor: validated.quote.baseHourlyRateMinor,
    discountPercent: validated.quote.discountPercent,
    effectiveHourlyRateMinor: validated.quote.effectiveHourlyRateMinor,
    durationMinutes: validated.quote.durationMinutes,
    amountMinor: validated.quote.amountMinor,
    actorUserId: input.actor.id,
    eventAction: "ADMIN_CREATED",
  });
  if (!inserted.ok) {
    mapOccupancy(inserted.reason);
  }

  await recordAudit({
    actorUserId: input.actor.id,
    targetUserId: user.id,
    action: AUDIT_ACTIONS.ROOM_BOOKING_ADMIN_CREATED,
    after: auditBookingSnapshot(inserted.booking),
  });
  return inserted.booking;
}

export async function waiveRoomBooking(input: {
  actor: User;
  bookingId: string;
  now?: Date;
}): Promise<RoomBooking> {
  requireAdmin(input.actor);
  const now = input.now ?? new Date();
  const {booking} = await loadVisibleBooking(input.actor, input.bookingId);
  if (!adminCanWaiveBooking(booking)) {
    throw new RoomError("notWaivable");
  }

  const waived = await waiveLateCancellationBooking({
    bookingId: booking.id,
    actorUserId: input.actor.id,
    now,
  });
  if (!waived.ok) {
    if (waived.reason === "missing") {
      throw new RoomError("notFound");
    }
    throw new RoomError("notWaivable");
  }

  await recordAudit({
    actorUserId: input.actor.id,
    targetUserId: waived.booking.userId,
    action: AUDIT_ACTIONS.ROOM_BOOKING_WAIVED,
    before: auditBookingSnapshot(waived.before),
    after: auditBookingSnapshot(waived.booking),
  });
  return waived.booking;
}

export async function getAdminRoomBooking(actor: User, bookingId: string): Promise<RoomBooking> {
  requireAdmin(actor);
  if (!isUuid(bookingId)) {
    throw new RoomError("notFound");
  }
  const booking = await findBookingById(bookingId);
  if (!booking) {
    throw new RoomError("notFound");
  }
  return booking;
}

async function requireRoomUser(userId: string): Promise<User> {
  if (!isUuid(userId)) {
    throw new RoomError("invalidUser");
  }
  const user = await findUserById(userId);
  if (!user || !canAccessRooms(user)) {
    throw new RoomError("invalidUser");
  }
  return user;
}
