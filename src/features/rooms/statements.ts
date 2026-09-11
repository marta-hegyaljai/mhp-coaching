import type {
  RoomStatement,
  RoomStatementLineItem,
  RoomStatementLineKind,
  User,
} from "@/db/schema";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {canAccessRooms, canAdminister} from "@/features/auth/policy";
import {findUserById, recordAudit} from "@/features/auth/repository";
import {RoomError} from "@/features/rooms/errors";
import {assertNoPrivateNoteMaterial} from "@/features/rooms/privacy";
import {
  canAdjustStatus,
  findStatementById,
  findStatementForUserMonth,
  findStatementOwner,
  finalizeExistingOpenStatement,
  insertAdjustmentLine,
  insertFinalizedStatement,
  isFinalizedStatus,
  isStatementUserMonthConflict,
  listLineItems,
  listStatementsForMonth,
  listStatementsForUser,
  type NewStatementLine,
} from "@/features/rooms/statement-repository";
import {formatZurichRange, isZurichMonthClosed, zurichMonthRange, type ZurichMonth} from "@/features/rooms/timezone";
import {
  emptyUserUsage,
  loadMonthUsage,
  resolveUsageMonth,
  type UsageLine,
  type UserUsage,
} from "@/features/rooms/usage";
import {
  formatPaymentMethodLabel,
  paymentMethodFromUser,
  type SavedPaymentMethod,
} from "@/features/payments/billing-method";

const MAX_REASON = 500;
const MIN_REASON = 3;

export type StatementDetail = {
  statement: RoomStatement;
  owner: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  lines: RoomStatementLineItem[];
  bookingLineTotalMinor: number;
  adjustmentTotalMinor: number;
};

export type FinalizePreview = {
  month: ZurichMonth;
  monthKey: string;
  open: boolean;
  alreadyFinalized: boolean;
  statement: RoomStatement | null;
  usage: UserUsage;
  paymentMethod: SavedPaymentMethod | null;
  paymentMethodLabel: string | null;
  warnings: Array<"monthOpen" | "noPaymentMethod" | "zeroTotal">;
  canFinalize: boolean;
};

function requireRoomActor(actor: User): void {
  if (!canAccessRooms(actor) && !canAdminister(actor)) {
    throw new RoomError("forbidden");
  }
}

function assertCanRead(actor: User, userId: string): void {
  requireRoomActor(actor);
  if (actor.id !== userId && !canAdminister(actor)) {
    throw new RoomError("forbidden");
  }
}

export function statementTotalsMatch(detail: StatementDetail): boolean {
  const sum = detail.lines.reduce((total, line) => total + line.amountMinor, 0);
  const bookingSum = detail.lines
    .filter((line) => line.kind !== "ADJUSTMENT")
    .reduce((total, line) => total + line.amountMinor, 0);
  const adjustmentSum = detail.lines
    .filter((line) => line.kind === "ADJUSTMENT")
    .reduce((total, line) => total + line.amountMinor, 0);
  const minutes = detail.lines
    .filter((line) => line.kind !== "ADJUSTMENT")
    .reduce((total, line) => total + line.minutes, 0);

  return (
    sum === detail.statement.totalMinor &&
    bookingSum === detail.bookingLineTotalMinor &&
    adjustmentSum === detail.adjustmentTotalMinor &&
    minutes === detail.statement.billedMinutes
  );
}

export function bookingDerivedLines(usage: UserUsage): NewStatementLine[] {
  return usage.lines
    .filter((line) => line.billedAmountMinor !== 0 || line.billedMinutes !== 0)
    .map((line) => toBookingLine(line));
}

function toBookingLine(line: UsageLine): NewStatementLine {
  const kind: RoomStatementLineKind =
    line.billingOutcome === "LATE_CANCELLATION" ? "LATE_CANCELLATION" : "USAGE";
  return {
    kind,
    bookingId: line.bookingId,
    description: `${line.roomName} · ${formatZurichRange(line.startsAt, line.endsAt)}`,
    minutes: line.billedMinutes,
    amountMinor: line.billedAmountMinor,
    reason: null,
  };
}

function lineTotals(lines: NewStatementLine[]): {billedMinutes: number; totalMinor: number} {
  return {
    billedMinutes: lines
      .filter((line) => line.kind !== "ADJUSTMENT")
      .reduce((sum, line) => sum + line.minutes, 0),
    totalMinor: lines.reduce((sum, line) => sum + line.amountMinor, 0),
  };
}

export async function previewFinalize(input: {
  actor: User;
  userId: string;
  month?: ZurichMonth | string;
  now?: Date;
}): Promise<FinalizePreview> {
  if (!canAdminister(input.actor)) {
    throw new RoomError("forbidden");
  }

  const now = input.now ?? new Date();
  const month = resolveUsageMonth({month: input.month, now});
  const report = await loadMonthUsage({
    actor: input.actor,
    month,
    now,
    userId: input.userId,
  });
  const target = await findUserById(input.userId);
  if (!target) {
    throw new RoomError("notFound");
  }

  const usage = report.users[0] ?? emptyUserUsage(target);
  const existing = await findStatementForUserMonth(input.userId, month);
  const paymentMethod = paymentMethodFromUser(target);
  const warnings: FinalizePreview["warnings"] = [];
  if (report.open) {
    warnings.push("monthOpen");
  }
  if (!paymentMethod && usage.billedAmountMinor > 0) {
    warnings.push("noPaymentMethod");
  }
  if (usage.billedAmountMinor === 0) {
    warnings.push("zeroTotal");
  }

  const alreadyFinalized = Boolean(existing && isFinalizedStatus(existing.status));

  return {
    month,
    monthKey: report.monthKey,
    open: report.open,
    alreadyFinalized,
    statement: existing ?? null,
    usage,
    paymentMethod,
    paymentMethodLabel: paymentMethod ? formatPaymentMethodLabel(paymentMethod) : null,
    warnings,
    canFinalize: !report.open && !alreadyFinalized,
  };
}

export async function finalizeUserMonth(input: {
  actor: User;
  userId: string;
  month?: ZurichMonth | string;
  now?: Date;
}): Promise<StatementDetail> {
  if (!canAdminister(input.actor)) {
    throw new RoomError("forbidden");
  }

  const now = input.now ?? new Date();
  const month = resolveUsageMonth({month: input.month, now});
  if (!isZurichMonthClosed(month, now)) {
    throw new RoomError("monthStillOpen");
  }

  const existing = await findStatementForUserMonth(input.userId, month);
  if (existing && isFinalizedStatus(existing.status)) {
    return loadStatementDetail({actor: input.actor, statementId: existing.id});
  }

  const report = await loadMonthUsage({
    actor: input.actor,
    month,
    now,
    userId: input.userId,
  });
  const target = await findUserById(input.userId);
  if (!target) {
    throw new RoomError("notFound");
  }
  const usage = report.users[0] ?? emptyUserUsage(target);
  const lines = bookingDerivedLines(usage);
  const totals = lineTotals(lines);
  const range = zurichMonthRange(month);

  let statement;
  try {
    if (existing && existing.status === "OPEN") {
      statement = await finalizeExistingOpenStatement({
        statement: existing,
        billedMinutes: totals.billedMinutes,
        totalMinor: totals.totalMinor,
        finalizedByUserId: input.actor.id,
        lines,
      });
    } else {
      statement = await insertFinalizedStatement({
        userId: input.userId,
        month,
        monthStart: range.start,
        monthEndExclusive: range.endExclusive,
        billedMinutes: totals.billedMinutes,
        totalMinor: totals.totalMinor,
        finalizedByUserId: input.actor.id,
        lines,
      });
    }
  } catch (error) {
    if (isStatementUserMonthConflict(error)) {
      const raced = await findStatementForUserMonth(input.userId, month);
      if (raced && isFinalizedStatus(raced.status)) {
        return loadStatementDetail({actor: input.actor, statementId: raced.id});
      }
    }
    throw error;
  }

  await recordAudit({
    actorUserId: input.actor.id,
    targetUserId: input.userId,
    action: AUDIT_ACTIONS.ROOM_STATEMENT_FINALIZED,
    before: existing
      ? {status: existing.status, totalMinor: existing.totalMinor}
      : null,
    after: {
      statementId: statement.id,
      year: statement.year,
      month: statement.month,
      status: statement.status,
      totalMinor: statement.totalMinor,
      billedMinutes: statement.billedMinutes,
      lineCount: lines.length,
    },
  });

  const detail = await loadStatementDetail({actor: input.actor, statementId: statement.id});
  assertNoPrivateNoteMaterial({
    statement: {
      id: detail.statement.id,
      status: detail.statement.status,
      totalMinor: detail.statement.totalMinor,
      billedMinutes: detail.statement.billedMinutes,
    },
    lines: detail.lines.map((line) => ({
      id: line.id,
      kind: line.kind,
      description: line.description,
      minutes: line.minutes,
      amountMinor: line.amountMinor,
      reason: line.reason,
    })),
  });
  return detail;
}

export async function addStatementAdjustment(input: {
  actor: User;
  statementId: string;
  amountMinor: number;
  reason: string;
}): Promise<StatementDetail> {
  if (!canAdminister(input.actor)) {
    throw new RoomError("forbidden");
  }

  const reason = input.reason.trim();
  if (reason.length < MIN_REASON || reason.length > MAX_REASON) {
    throw new RoomError("invalidAdjustment");
  }
  if (!Number.isInteger(input.amountMinor) || input.amountMinor === 0) {
    throw new RoomError("invalidAdjustment");
  }

  const statement = await findStatementById(input.statementId);
  if (!statement) {
    throw new RoomError("notFound");
  }
  if (!canAdjustStatus(statement.status)) {
    throw new RoomError("statementLocked");
  }

  const nextTotal = statement.totalMinor + input.amountMinor;
  const updated = await insertAdjustmentLine({
    statementId: statement.id,
    description: reason,
    amountMinor: input.amountMinor,
    reason,
    createdByUserId: input.actor.id,
    nextTotalMinor: nextTotal,
  });

  await recordAudit({
    actorUserId: input.actor.id,
    targetUserId: statement.userId,
    action: AUDIT_ACTIONS.ROOM_STATEMENT_ADJUSTED,
    before: {totalMinor: statement.totalMinor, status: statement.status},
    after: {
      statementId: statement.id,
      lineId: updated.line.id,
      amountMinor: input.amountMinor,
      totalMinor: updated.statement.totalMinor,
    },
  });

  return loadStatementDetail({actor: input.actor, statementId: statement.id});
}

export async function loadStatementDetail(input: {
  actor: User;
  statementId: string;
}): Promise<StatementDetail> {
  const statement = await findStatementById(input.statementId);
  if (!statement) {
    throw new RoomError("notFound");
  }
  assertCanRead(input.actor, statement.userId);

  const owner = await findStatementOwner(statement.userId);
  if (!owner) {
    throw new RoomError("notFound");
  }
  const lines = await listLineItems(statement.id);
  const detail: StatementDetail = {
    statement,
    owner: {
      userId: owner.id,
      email: owner.email,
      firstName: owner.firstName,
      lastName: owner.lastName,
    },
    lines,
    bookingLineTotalMinor: lines
      .filter((line) => line.kind !== "ADJUSTMENT")
      .reduce((sum, line) => sum + line.amountMinor, 0),
    adjustmentTotalMinor: lines
      .filter((line) => line.kind === "ADJUSTMENT")
      .reduce((sum, line) => sum + line.amountMinor, 0),
  };

  assertNoPrivateNoteMaterial({
    statement: {
      id: statement.id,
      userId: statement.userId,
      status: statement.status,
      totalMinor: statement.totalMinor,
    },
    lines: lines.map((line) => ({
      kind: line.kind,
      description: line.description,
      amountMinor: line.amountMinor,
      reason: line.reason,
    })),
    owner: detail.owner,
  });

  return detail;
}

export async function loadOwnStatements(actor: User): Promise<RoomStatement[]> {
  requireRoomActor(actor);
  return listStatementsForUser(actor.id);
}

export async function loadUserStatements(input: {
  actor: User;
  userId: string;
}): Promise<RoomStatement[]> {
  assertCanRead(input.actor, input.userId);
  return listStatementsForUser(input.userId);
}

export async function loadMonthStatements(input: {
  actor: User;
  month: ZurichMonth;
}): Promise<RoomStatement[]> {
  if (!canAdminister(input.actor)) {
    throw new RoomError("forbidden");
  }
  return listStatementsForMonth(input.month);
}

export function publicStatementProjection(detail: StatementDetail) {
  return {
    id: detail.statement.id,
    year: detail.statement.year,
    month: detail.statement.month,
    status: detail.statement.status,
    currency: detail.statement.currency,
    billedMinutes: detail.statement.billedMinutes,
    totalMinor: detail.statement.totalMinor,
    finalizedAt: detail.statement.finalizedAt,
    owner: detail.owner,
    lines: detail.lines.map((line) => ({
      id: line.id,
      kind: line.kind,
      description: line.description,
      minutes: line.minutes,
      amountMinor: line.amountMinor,
      reason: line.kind === "ADJUSTMENT" ? line.reason : null,
    })),
  };
}
