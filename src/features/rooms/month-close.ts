import {chargeStatement} from "@/features/rooms/charging";
import {notifyStatementFinalized} from "@/features/rooms/notifications";
import {listRoomBillableUsers, findStatementForUserMonth} from "@/features/rooms/statement-repository";
import {finalizeUserMonth} from "@/features/rooms/statements";
import {
  isZurichMonthClosed,
  openZurichMonth,
  previousZurichMonth,
} from "@/features/rooms/timezone";
import {loadMonthUsage} from "@/features/rooms/usage";

export async function closePreviousZurichMonth(now = new Date()): Promise<{
  skipped: boolean;
  reason?: string;
  finalized: number;
  charged: number;
}> {
  const previous = previousZurichMonth(openZurichMonth(now));
  if (!isZurichMonthClosed(previous, now)) {
    return {skipped: true, reason: "month_open", finalized: 0, charged: 0};
  }

  const users = await listRoomBillableUsers();
  let finalized = 0;
  let charged = 0;

  for (const owner of users) {
    const existing = await findStatementForUserMonth(owner.id, previous);
    const report = await loadMonthUsage({
      system: true,
      userId: owner.id,
      month: previous,
      now,
    });
    const usage = report.users[0];
    const hasActivity =
      Boolean(existing) ||
      Boolean(usage && (usage.bookingCount > 0 || usage.billedAmountMinor !== 0 || usage.billedMinutes !== 0));
    if (!hasActivity) {
      continue;
    }

    const detail = await finalizeUserMonth({
      system: true,
      userId: owner.id,
      month: previous,
      now,
    });
    finalized += 1;
    await notifyStatementFinalized(detail);

    const outcome = await chargeStatement({
      system: true,
      statementId: detail.statement.id,
    });
    if (outcome.status === "PAID" || outcome.status === "PAYMENT_FAILED" || outcome.status === "PAYMENT_PENDING") {
      charged += 1;
    }
  }

  return {skipped: false, finalized, charged};
}
