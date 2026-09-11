import {and, desc, eq, sql} from "drizzle-orm";

import {getDb} from "@/db";
import {
  roomNotifications,
  type RoomNotification,
  type RoomNotificationKind,
  type RoomNotificationStatus,
} from "@/db/schema";
import {isUniqueViolation} from "@/features/auth/unique-email";
import {ROOM_NOTIFICATIONS_IDEMPOTENCY_UNIQUE} from "@/features/rooms/statement-repository";

export async function findNotificationByKey(
  idempotencyKey: string,
): Promise<RoomNotification | undefined> {
  const [row] = await getDb()
    .select()
    .from(roomNotifications)
    .where(eq(roomNotifications.idempotencyKey, idempotencyKey))
    .limit(1);
  return row;
}

export async function insertPendingNotification(input: {
  kind: RoomNotificationKind;
  status?: RoomNotificationStatus;
  idempotencyKey: string;
  userId: string;
  toEmail: string;
  locale: string;
  bookingId?: string | null;
  statementId?: string | null;
  requestId?: string | null;
  payload: Record<string, unknown>;
}): Promise<RoomNotification | undefined> {
  try {
    const [row] = await getDb()
      .insert(roomNotifications)
      .values({
        kind: input.kind,
        status: input.status ?? "PENDING",
        idempotencyKey: input.idempotencyKey,
        userId: input.userId,
        toEmail: input.toEmail,
        locale: input.locale,
        bookingId: input.bookingId ?? null,
        statementId: input.statementId ?? null,
        requestId: input.requestId ?? null,
        payload: input.payload,
      })
      .returning();
    return row;
  } catch (error) {
    if (isUniqueViolation(error, ROOM_NOTIFICATIONS_IDEMPOTENCY_UNIQUE) || isUniqueViolation(error)) {
      return undefined;
    }
    throw error;
  }
}

export async function claimFailedNotification(
  id: string,
): Promise<RoomNotification | undefined> {
  const [row] = await getDb()
    .update(roomNotifications)
    .set({status: "PENDING", lastError: null})
    .where(and(eq(roomNotifications.id, id), eq(roomNotifications.status, "FAILED")))
    .returning();
  return row;
}

export async function markNotificationSent(input: {
  id: string;
  provider: string;
  providerMessageId: string | null;
}): Promise<void> {
  await getDb()
    .update(roomNotifications)
    .set({
      status: "SENT",
      provider: input.provider,
      providerMessageId: input.providerMessageId,
      lastError: null,
      sentAt: new Date(),
    })
    .where(eq(roomNotifications.id, input.id));
}

export async function markNotificationFailed(input: {id: string; lastError: string}): Promise<void> {
  await getDb()
    .update(roomNotifications)
    .set({
      status: "FAILED",
      lastError: input.lastError.slice(0, 500),
    })
    .where(eq(roomNotifications.id, input.id));
}

export async function listNotificationsForStatement(
  statementId: string,
): Promise<RoomNotification[]> {
  return getDb()
    .select()
    .from(roomNotifications)
    .where(eq(roomNotifications.statementId, statementId))
    .orderBy(desc(roomNotifications.createdAt), desc(roomNotifications.id));
}

export async function listNotificationsForBooking(bookingId: string): Promise<RoomNotification[]> {
  return getDb()
    .select()
    .from(roomNotifications)
    .where(eq(roomNotifications.bookingId, bookingId))
    .orderBy(desc(roomNotifications.createdAt), desc(roomNotifications.id));
}

export async function listRecentNotifications(limit = 80): Promise<RoomNotification[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 200);
  return getDb()
    .select()
    .from(roomNotifications)
    .orderBy(desc(roomNotifications.createdAt), desc(roomNotifications.id))
    .limit(safeLimit);
}

export async function countNotifications(): Promise<number> {
  const [row] = await getDb()
    .select({value: sql<number>`count(*)`})
    .from(roomNotifications);
  return Number(row?.value ?? 0);
}
