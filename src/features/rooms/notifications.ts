import type {
  RoomBooking,
  RoomNotification,
  RoomNotificationKind,
  User,
} from "@/db/schema";
import {canAdminister} from "@/features/auth/policy";
import {findUserById} from "@/features/auth/repository";
import {isHostedPreviewMailBlocked} from "@/features/email/preview";
import {mailLocale} from "@/features/email/locale";
import type {AppLocale} from "@/i18n/routing";
import {
  sendAdminCreatedRoomBooking,
  sendAdminMovedRoomBooking,
  sendAvailabilityRequestCreated,
  sendAvailabilityRequestCreatedStaff,
  sendAvailabilityRequestDecision,
  sendRoomBookingCancelled,
  sendRoomBookingChanged,
  sendRoomBookingConfirmed,
  sendRoomBookingReminder,
  sendStatementFinalizedMail,
  sendStatementPaymentFailedMail,
  sendStatementPaymentSucceededMail,
} from "@/features/email/room-booking";
import {organization} from "@/features/organization/info";
import {formatChf, minorUnitsToFrancs} from "@/features/payments/money";
import {RoomError} from "@/features/rooms/errors";
import {
  claimFailedNotification,
  findNotificationByKey,
  insertPendingNotification,
  listNotificationsForBooking,
  listNotificationsForStatement,
  listRecentNotifications,
  markNotificationFailed,
  markNotificationSent,
} from "@/features/rooms/notification-repository";
import {assertNoPrivateNoteMaterial} from "@/features/rooms/privacy";
import type {StatementDetail} from "@/features/rooms/statements";
import {formatZurichRange} from "@/features/rooms/timezone";
import {formatMonthYear} from "@/shared/format/calendar-date";
import {formatLocalDate} from "@/features/rooms/timezone";

type DeliverInput = {
  kind: RoomNotificationKind;
  idempotencyKey: string;
  userId: string;
  toEmail: string;
  locale: string;
  bookingId?: string | null;
  statementId?: string | null;
  requestId?: string | null;
  payload: Record<string, unknown>;
  send: () => Promise<{provider: string; messageId: string | null} | void>;
};

function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/\s+/g, " ").slice(0, 500);
  }
  return "send_failed";
}

export function publicBookingPayload(booking: Pick<RoomBooking, "roomName" | "startsAt" | "endsAt" | "amountMinor">) {
  return {
    roomName: booking.roomName,
    time: formatZurichRange(booking.startsAt, booking.endsAt),
    amountMinor: booking.amountMinor,
  };
}

async function deliverRoomNotification(input: DeliverInput): Promise<RoomNotification | undefined> {
  assertNoPrivateNoteMaterial({
    kind: input.kind,
    toEmail: input.toEmail,
    payload: input.payload,
  });

  const skipped = isHostedPreviewMailBlocked();
  let row = await insertPendingNotification({
    kind: input.kind,
    status: skipped ? "SKIPPED" : "PENDING",
    idempotencyKey: input.idempotencyKey,
    userId: input.userId,
    toEmail: input.toEmail,
    locale: input.locale,
    bookingId: input.bookingId,
    statementId: input.statementId,
    requestId: input.requestId,
    payload: input.payload,
  });

  if (!row) {
    const existing = await findNotificationByKey(input.idempotencyKey);
    if (!existing) {
      return undefined;
    }
    if (existing.status === "SENT" || existing.status === "SKIPPED" || existing.status === "PENDING") {
      return existing;
    }
    row = (await claimFailedNotification(existing.id)) ?? existing;
    if (row.status !== "PENDING") {
      return row;
    }
  }

  if (row.status === "SKIPPED") {
    return row;
  }

  try {
    const delivery = await input.send();
    await markNotificationSent({
      id: row.id,
      provider: delivery?.provider ?? "smtp",
      providerMessageId: delivery?.messageId ?? null,
    });
    return (await findNotificationByKey(input.idempotencyKey)) ?? row;
  } catch (error) {
    console.error("Room notification send failed", {kind: input.kind, id: row.id});
    await markNotificationFailed({id: row.id, lastError: sanitizeError(error)});
    return (await findNotificationByKey(input.idempotencyKey)) ?? row;
  }
}

export async function notifyRoomBookingConfirmed(input: {
  user: User;
  booking: RoomBooking;
}): Promise<void> {
  await deliverRoomNotification({
    kind: "BOOKING_CONFIRMED",
    idempotencyKey: `booking_confirmed:${input.booking.id}`,
    userId: input.user.id,
    toEmail: input.user.email,
    locale: mailLocale(input.user.locale),
    bookingId: input.booking.id,
    payload: publicBookingPayload(input.booking),
    send: () => sendRoomBookingConfirmed(input),
  });
}

export async function notifyRoomBookingChanged(input: {
  user: User;
  booking: RoomBooking;
}): Promise<void> {
  await deliverRoomNotification({
    kind: "BOOKING_CHANGED",
    idempotencyKey: `booking_changed:${input.booking.id}:${input.booking.updatedAt.getTime()}`,
    userId: input.user.id,
    toEmail: input.user.email,
    locale: mailLocale(input.user.locale),
    bookingId: input.booking.id,
    payload: publicBookingPayload(input.booking),
    send: () => sendRoomBookingChanged(input),
  });
}

export async function notifyRoomBookingCancelled(input: {
  user: User;
  booking: RoomBooking;
}): Promise<void> {
  await deliverRoomNotification({
    kind: "BOOKING_CANCELLED",
    idempotencyKey: `booking_cancelled:${input.booking.id}`,
    userId: input.user.id,
    toEmail: input.user.email,
    locale: mailLocale(input.user.locale),
    bookingId: input.booking.id,
    payload: publicBookingPayload(input.booking),
    send: () => sendRoomBookingCancelled(input),
  });
}

export async function notifyRoomBookingReminder(input: {
  user: User;
  booking: RoomBooking;
}): Promise<RoomNotification | undefined> {
  return deliverRoomNotification({
    kind: "BOOKING_REMINDER",
    idempotencyKey: `booking_reminder:${input.booking.id}`,
    userId: input.user.id,
    toEmail: input.user.email,
    locale: mailLocale(input.user.locale),
    bookingId: input.booking.id,
    payload: publicBookingPayload(input.booking),
    send: () => sendRoomBookingReminder(input),
  });
}

export async function notifyAdminCreatedRoomBooking(input: {
  user: User;
  booking: RoomBooking;
}): Promise<void> {
  await deliverRoomNotification({
    kind: "ADMIN_CREATED",
    idempotencyKey: `admin_created:${input.booking.id}`,
    userId: input.user.id,
    toEmail: input.user.email,
    locale: mailLocale(input.user.locale),
    bookingId: input.booking.id,
    payload: publicBookingPayload(input.booking),
    send: () => sendAdminCreatedRoomBooking(input),
  });
}

export async function notifyAdminMovedRoomBooking(input: {
  user: User;
  booking: RoomBooking;
}): Promise<void> {
  await deliverRoomNotification({
    kind: "ADMIN_MOVED",
    idempotencyKey: `admin_moved:${input.booking.id}:${input.booking.updatedAt.getTime()}`,
    userId: input.user.id,
    toEmail: input.user.email,
    locale: mailLocale(input.user.locale),
    bookingId: input.booking.id,
    payload: publicBookingPayload(input.booking),
    send: () => sendAdminMovedRoomBooking(input),
  });
}

export async function notifyAvailabilityRequestCreated(input: {
  user: User;
  requestId: string;
  time: string;
  roomName: string | null;
}): Promise<void> {
  const payload = {time: input.time, roomName: input.roomName};
  await deliverRoomNotification({
    kind: "REQUEST_CREATED",
    idempotencyKey: `request_created:${input.requestId}`,
    userId: input.user.id,
    toEmail: input.user.email,
    locale: mailLocale(input.user.locale),
    requestId: input.requestId,
    payload,
    send: () =>
      sendAvailabilityRequestCreated({
        user: input.user,
        time: input.time,
        roomName: input.roomName,
      }),
  });
  await deliverRoomNotification({
    kind: "REQUEST_CREATED_STAFF",
    idempotencyKey: `request_created_staff:${input.requestId}`,
    userId: input.user.id,
    toEmail: organization.email,
    locale: "fr",
    requestId: input.requestId,
    payload: {
      time: input.time,
      roomName: input.roomName,
      ownerEmail: input.user.email,
      ownerName: `${input.user.firstName} ${input.user.lastName}`.trim(),
    },
    send: () =>
      sendAvailabilityRequestCreatedStaff({
        ownerEmail: input.user.email,
        ownerName: `${input.user.firstName} ${input.user.lastName}`.trim(),
        time: input.time,
        roomName: input.roomName,
      }),
  });
}

export async function notifyAvailabilityRequestDecision(input: {
  user: User;
  requestId: string;
  decision: "RESOLVED" | "DECLINED";
  time: string;
  roomName: string | null;
}): Promise<void> {
  await deliverRoomNotification({
    kind: input.decision === "RESOLVED" ? "REQUEST_RESOLVED" : "REQUEST_DECLINED",
    idempotencyKey: `request_${input.decision.toLowerCase()}:${input.requestId}`,
    userId: input.user.id,
    toEmail: input.user.email,
    locale: mailLocale(input.user.locale),
    requestId: input.requestId,
    payload: {time: input.time, roomName: input.roomName, decision: input.decision},
    send: () =>
      sendAvailabilityRequestDecision({
        user: input.user,
        decision: input.decision,
        time: input.time,
        roomName: input.roomName,
      }),
  });
}

function statementMailBits(detail: StatementDetail, locale: AppLocale) {
  const monthLabel = formatMonthYear(
    formatLocalDate(detail.statement.year, detail.statement.month, 1),
    locale,
  );
  return {
    monthLabel,
    amount: formatChf(minorUnitsToFrancs(detail.statement.totalMinor), locale),
    minutes: detail.statement.billedMinutes,
  };
}

export async function notifyStatementFinalized(detail: StatementDetail): Promise<void> {
  const user = await findUserById(detail.owner.userId);
  if (!user) {
    return;
  }
  const locale = mailLocale(user.locale);
  const bits = statementMailBits(detail, locale);
  await deliverRoomNotification({
    kind: "STATEMENT_FINALIZED",
    idempotencyKey: `statement_finalized:${detail.statement.id}`,
    userId: user.id,
    toEmail: user.email,
    locale,
    statementId: detail.statement.id,
    payload: {
      month: bits.monthLabel,
      amountMinor: detail.statement.totalMinor,
      billedMinutes: detail.statement.billedMinutes,
    },
    send: () => sendStatementFinalizedMail({user, ...bits}),
  });
}

export async function notifyPaymentSucceeded(detail: StatementDetail): Promise<void> {
  const user = await findUserById(detail.owner.userId);
  if (!user) {
    return;
  }
  const locale = mailLocale(user.locale);
  const bits = statementMailBits(detail, locale);
  await deliverRoomNotification({
    kind: "PAYMENT_SUCCEEDED",
    idempotencyKey: `payment_succeeded:${detail.statement.id}`,
    userId: user.id,
    toEmail: user.email,
    locale,
    statementId: detail.statement.id,
    payload: {month: bits.monthLabel, amountMinor: detail.statement.totalMinor},
    send: () => sendStatementPaymentSucceededMail({user, monthLabel: bits.monthLabel, amount: bits.amount}),
  });
}

export async function notifyPaymentFailed(detail: StatementDetail): Promise<void> {
  const user = await findUserById(detail.owner.userId);
  if (!user) {
    return;
  }
  const locale = mailLocale(user.locale);
  const bits = statementMailBits(detail, locale);
  await deliverRoomNotification({
    kind: "PAYMENT_FAILED",
    idempotencyKey: `payment_failed:${detail.statement.id}:${detail.statement.chargeAttempt}`,
    userId: user.id,
    toEmail: user.email,
    locale,
    statementId: detail.statement.id,
    payload: {
      month: bits.monthLabel,
      amountMinor: detail.statement.totalMinor,
      failureCode: detail.statement.failureCode,
    },
    send: () => sendStatementPaymentFailedMail({user, monthLabel: bits.monthLabel, amount: bits.amount}),
  });
}

export function publicNotificationProjection(row: RoomNotification) {
  const projection = {
    id: row.id,
    kind: row.kind,
    status: row.status,
    toEmail: row.toEmail,
    locale: row.locale,
    createdAt: row.createdAt.toISOString(),
    sentAt: row.sentAt?.toISOString() ?? null,
    provider: row.provider,
    providerMessageId: row.providerMessageId,
    lastError: row.lastError,
    bookingId: row.bookingId,
    statementId: row.statementId,
    requestId: row.requestId,
    payload: row.payload,
  };
  assertNoPrivateNoteMaterial(projection);
  return projection;
}

export async function loadStatementNotifications(input: {
  actor: User;
  statementId: string;
}) {
  if (!canAdminister(input.actor)) {
    throw new RoomError("forbidden");
  }
  const rows = await listNotificationsForStatement(input.statementId);
  return rows.map(publicNotificationProjection);
}

export async function loadBookingNotifications(input: {actor: User; bookingId: string}) {
  if (!canAdminister(input.actor)) {
    throw new RoomError("forbidden");
  }
  const rows = await listNotificationsForBooking(input.bookingId);
  return rows.map(publicNotificationProjection);
}

export async function loadRecentNotifications(actor: User, limit = 80) {
  if (!canAdminister(actor)) {
    throw new RoomError("forbidden");
  }
  const rows = await listRecentNotifications(limit);
  return rows.map(publicNotificationProjection);
}
