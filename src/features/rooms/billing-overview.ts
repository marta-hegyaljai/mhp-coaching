import type {RoomBooking, RoomStatement, RoomStatementStatus, User} from "@/db/schema";
import {canAccessRooms} from "@/features/auth/policy";
import type {PathnameHref} from "@/i18n/href";
import {RoomError} from "@/features/rooms/errors";
import {listOwnBookings} from "@/features/rooms/repository";
import {isFinalizedStatus, listStatementsForUser} from "@/features/rooms/statement-repository";
import {
  openZurichMonth,
  parseZurichMonthKey,
  zurichMonthKey,
  zurichMonthOf,
  type ZurichMonth,
} from "@/features/rooms/timezone";
import {projectUsageLine, type UsageLine} from "@/features/rooms/usage";

export type BillingMonthKind = "open" | "projected" | "awaiting_statement" | "statement";

export type BillingMonthRow = {
  year: number;
  month: number;
  monthKey: string;
  kind: BillingMonthKind;
  isCurrentMonth: boolean;
  statementId?: string;
  statementStatus?: RoomStatementStatus;
  billedMinutes: number;
  billedAmountMinor: number;
  bookingCount: number;
  href: PathnameHref;
};

export type BillingOverview = {
  rows: BillingMonthRow[];
  openMonth: ZurichMonth;
  unsettledStatements: RoomStatement[];
};

type MonthTotals = {
  billedMinutes: number;
  billedAmountMinor: number;
  bookingCount: number;
};

export function compareZurichMonth(left: ZurichMonth, right: ZurichMonth): number {
  if (left.year !== right.year) {
    return left.year - right.year;
  }
  return left.month - right.month;
}

function emptyTotals(): MonthTotals {
  return {billedMinutes: 0, billedAmountMinor: 0, bookingCount: 0};
}

function totalsFromLines(lines: UsageLine[]): MonthTotals {
  return lines.reduce(
    (totals, line) => ({
      billedMinutes: totals.billedMinutes + line.billedMinutes,
      billedAmountMinor: totals.billedAmountMinor + line.billedAmountMinor,
      bookingCount: totals.bookingCount + 1,
    }),
    emptyTotals(),
  );
}

function groupBookingsByMonth(bookings: RoomBooking[]): Map<string, UsageLine[]> {
  const grouped = new Map<string, UsageLine[]>();

  for (const booking of bookings) {
    const key = zurichMonthKey(zurichMonthOf(booking.startsAt));
    const lines = grouped.get(key) ?? [];
    lines.push(projectUsageLine(booking));
    grouped.set(key, lines);
  }

  for (const [key, lines] of grouped) {
    grouped.set(
      key,
      lines.sort(
        (left, right) =>
          left.startsAt.getTime() - right.startsAt.getTime() ||
          left.bookingId.localeCompare(right.bookingId),
      ),
    );
  }

  return grouped;
}

function hrefForMonth(
  month: ZurichMonth,
  statement: RoomStatement | undefined,
): PathnameHref {
  if (statement && isFinalizedStatus(statement.status)) {
    return {pathname: "/billing/statements/[id]", params: {id: statement.id}};
  }

  return {
    pathname: "/billing/[year]/[month]",
    params: {year: String(month.year), month: String(month.month)},
  };
}

function resolveKind(input: {
  month: ZurichMonth;
  openMonth: ZurichMonth;
  statement?: RoomStatement;
}): BillingMonthKind {
  if (input.statement && isFinalizedStatus(input.statement.status)) {
    return "statement";
  }
  const comparison = compareZurichMonth(input.month, input.openMonth);
  if (comparison === 0) {
    return "open";
  }
  if (comparison > 0) {
    return "projected";
  }
  return "awaiting_statement";
}

export function buildBillingOverview(input: {
  bookings: RoomBooking[];
  statements: RoomStatement[];
  now?: Date;
}): BillingOverview {
  const now = input.now ?? new Date();
  const openMonth = openZurichMonth(now);
  const usageByMonth = groupBookingsByMonth(input.bookings);
  const statementByKey = new Map(
    input.statements.map((statement) => [
      zurichMonthKey({year: statement.year, month: statement.month}),
      statement,
    ]),
  );
  const monthKeys = new Set([...usageByMonth.keys(), ...statementByKey.keys()]);

  const rows = [...monthKeys]
    .map((monthKey) => {
      const month = parseZurichMonthKey(monthKey);
      const statement = statementByKey.get(monthKey);
      const lines = usageByMonth.get(monthKey) ?? [];
      const liveTotals = totalsFromLines(lines);
      const totals =
        statement && isFinalizedStatus(statement.status)
          ? {
              billedMinutes: statement.billedMinutes,
              billedAmountMinor: statement.totalMinor,
              bookingCount: lines.length,
            }
          : liveTotals;
      const kind = resolveKind({month, openMonth, statement});

      return {
        year: month.year,
        month: month.month,
        monthKey,
        kind,
        isCurrentMonth: monthKey === zurichMonthKey(openMonth),
        statementId: statement?.id,
        statementStatus: statement?.status,
        billedMinutes: totals.billedMinutes,
        billedAmountMinor: totals.billedAmountMinor,
        bookingCount: totals.bookingCount,
        href: hrefForMonth(month, statement),
      } satisfies BillingMonthRow;
    })
    .filter((row) => row.bookingCount > 0 || row.kind === "statement")
    .sort((left, right) => compareZurichMonth(right, left));

  const unsettledStatements = input.statements.filter(
    (statement) =>
      statement.status === "PAYMENT_FAILED" ||
      (statement.status === "FINALIZED" && statement.totalMinor > 0),
  );

  return {
    rows,
    openMonth,
    unsettledStatements,
  };
}

export async function loadOwnBillingOverview(
  actor: User,
  now = new Date(),
): Promise<BillingOverview> {
  if (!canAccessRooms(actor)) {
    throw new RoomError("forbidden");
  }

  const [bookings, statements] = await Promise.all([
    listOwnBookings(actor.id),
    listStatementsForUser(actor.id),
  ]);

  return buildBillingOverview({bookings, statements, now});
}
