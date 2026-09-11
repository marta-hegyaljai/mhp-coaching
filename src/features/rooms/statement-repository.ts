import {and, asc, desc, eq, isNull} from "drizzle-orm";

import {getDb} from "@/db";
import {
  roomStatementLineItems,
  roomStatements,
  users,
  type RoomStatement,
  type RoomStatementLineItem,
  type RoomStatementLineKind,
  type RoomStatementStatus,
  type User,
} from "@/db/schema";
import type {ZurichMonth} from "@/features/rooms/timezone";
import {isUniqueViolation} from "@/features/auth/unique-email";

export const ROOM_STATEMENTS_USER_MONTH_UNIQUE = "room_statements_user_month_uidx";

export type StatementOwner = Pick<
  User,
  "id" | "email" | "firstName" | "lastName" | "roomDiscountPercent"
>;

export type NewStatementLine = {
  kind: RoomStatementLineKind;
  bookingId?: string | null;
  description: string;
  minutes: number;
  amountMinor: number;
  reason?: string | null;
  createdByUserId?: string | null;
};

export async function findStatementById(id: string): Promise<RoomStatement | undefined> {
  const [row] = await getDb().select().from(roomStatements).where(eq(roomStatements.id, id)).limit(1);
  return row;
}

export async function findStatementForUserMonth(
  userId: string,
  month: ZurichMonth,
): Promise<RoomStatement | undefined> {
  const [row] = await getDb()
    .select()
    .from(roomStatements)
    .where(
      and(
        eq(roomStatements.userId, userId),
        eq(roomStatements.year, month.year),
        eq(roomStatements.month, month.month),
      ),
    )
    .limit(1);
  return row;
}

export async function listStatementsForUser(userId: string): Promise<RoomStatement[]> {
  return getDb()
    .select()
    .from(roomStatements)
    .where(eq(roomStatements.userId, userId))
    .orderBy(desc(roomStatements.year), desc(roomStatements.month));
}

export async function listStatementsForMonth(month: ZurichMonth): Promise<RoomStatement[]> {
  return getDb()
    .select()
    .from(roomStatements)
    .where(and(eq(roomStatements.year, month.year), eq(roomStatements.month, month.month)))
    .orderBy(asc(roomStatements.userId));
}

export async function listLineItems(statementId: string): Promise<RoomStatementLineItem[]> {
  return getDb()
    .select()
    .from(roomStatementLineItems)
    .where(eq(roomStatementLineItems.statementId, statementId))
    .orderBy(asc(roomStatementLineItems.createdAt), asc(roomStatementLineItems.id));
}

export async function findStatementOwner(userId: string): Promise<StatementOwner | undefined> {
  const [row] = await getDb()
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      roomDiscountPercent: users.roomDiscountPercent,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row;
}

export async function listRoomBillableUsers(): Promise<StatementOwner[]> {
  return getDb()
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      roomDiscountPercent: users.roomDiscountPercent,
    })
    .from(users)
    .where(and(eq(users.roomBookingEnabled, true), isNull(users.disabledAt)))
    .orderBy(asc(users.lastName), asc(users.firstName), asc(users.email));
}

export async function insertFinalizedStatement(input: {
  userId: string;
  month: ZurichMonth;
  monthStart: Date;
  monthEndExclusive: Date;
  billedMinutes: number;
  totalMinor: number;
  finalizedByUserId: string;
  lines: NewStatementLine[];
}): Promise<RoomStatement> {
  return getDb().transaction(async (tx) => {
    const [statement] = await tx
      .insert(roomStatements)
      .values({
        userId: input.userId,
        year: input.month.year,
        month: input.month.month,
        monthStart: input.monthStart,
        monthEndExclusive: input.monthEndExclusive,
        status: "OPEN",
        currency: "CHF",
        billedMinutes: input.billedMinutes,
        totalMinor: input.totalMinor,
      })
      .returning();

    if (input.lines.length > 0) {
      await tx.insert(roomStatementLineItems).values(
        input.lines.map((line) => ({
          statementId: statement.id,
          kind: line.kind,
          bookingId: line.bookingId ?? null,
          description: line.description,
          minutes: line.minutes,
          amountMinor: line.amountMinor,
          reason: line.reason ?? null,
          createdByUserId: line.createdByUserId ?? input.finalizedByUserId,
        })),
      );
    }

    const [finalized] = await tx
      .update(roomStatements)
      .set({
        status: "FINALIZED",
        finalizedAt: new Date(),
        finalizedByUserId: input.finalizedByUserId,
        updatedAt: new Date(),
      })
      .where(eq(roomStatements.id, statement.id))
      .returning();

    return finalized;
  });
}

export async function finalizeExistingOpenStatement(input: {
  statement: RoomStatement;
  billedMinutes: number;
  totalMinor: number;
  finalizedByUserId: string;
  lines: NewStatementLine[];
}): Promise<RoomStatement> {
  return getDb().transaction(async (tx) => {
    await tx
      .delete(roomStatementLineItems)
      .where(eq(roomStatementLineItems.statementId, input.statement.id));

    if (input.lines.length > 0) {
      await tx.insert(roomStatementLineItems).values(
        input.lines.map((line) => ({
          statementId: input.statement.id,
          kind: line.kind,
          bookingId: line.bookingId ?? null,
          description: line.description,
          minutes: line.minutes,
          amountMinor: line.amountMinor,
          reason: line.reason ?? null,
          createdByUserId: line.createdByUserId ?? input.finalizedByUserId,
        })),
      );
    }

    const [finalized] = await tx
      .update(roomStatements)
      .set({
        billedMinutes: input.billedMinutes,
        totalMinor: input.totalMinor,
        status: "FINALIZED",
        finalizedAt: new Date(),
        finalizedByUserId: input.finalizedByUserId,
        updatedAt: new Date(),
      })
      .where(eq(roomStatements.id, input.statement.id))
      .returning();

    return finalized;
  });
}

export async function insertAdjustmentLine(input: {
  statementId: string;
  description: string;
  amountMinor: number;
  reason: string;
  createdByUserId: string;
  nextTotalMinor: number;
}): Promise<{statement: RoomStatement; line: RoomStatementLineItem}> {
  return getDb().transaction(async (tx) => {
    const [line] = await tx
      .insert(roomStatementLineItems)
      .values({
        statementId: input.statementId,
        kind: "ADJUSTMENT",
        bookingId: null,
        description: input.description,
        minutes: 0,
        amountMinor: input.amountMinor,
        reason: input.reason,
        createdByUserId: input.createdByUserId,
      })
      .returning();

    const [statement] = await tx
      .update(roomStatements)
      .set({
        totalMinor: input.nextTotalMinor,
        updatedAt: new Date(),
      })
      .where(eq(roomStatements.id, input.statementId))
      .returning();

    return {statement, line};
  });
}

export function isStatementUserMonthConflict(error: unknown): boolean {
  return isUniqueViolation(error, ROOM_STATEMENTS_USER_MONTH_UNIQUE) || isUniqueViolation(error);
}

export async function lockStatementById(
  statementId: string,
): Promise<RoomStatement | undefined> {
  const [row] = await getDb()
    .select()
    .from(roomStatements)
    .where(eq(roomStatements.id, statementId))
    .limit(1);
  return row;
}

export function isFinalizedStatus(status: RoomStatementStatus): boolean {
  return status !== "OPEN";
}

export function canAdjustStatus(status: RoomStatementStatus): boolean {
  return status === "FINALIZED";
}
