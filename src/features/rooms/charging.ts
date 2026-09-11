import type {User} from "@/db/schema";
import {canAdminister} from "@/features/auth/policy";
import {findUserById, recordAudit} from "@/features/auth/repository";
import {getBillingPaymentAdapter} from "@/features/payments/get-billing-adapter";
import {paymentMethodFromUser} from "@/features/payments/billing-method";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {RoomError} from "@/features/rooms/errors";
import {
  notifyPaymentFailed,
  notifyPaymentSucceeded,
} from "@/features/rooms/notifications";
import {assertNoPrivateNoteMaterial} from "@/features/rooms/privacy";
import {
  claimStatementForCharge,
  findStatementById,
  findStatementByPaymentIntent,
  markStatementPaid,
  markStatementPaymentFailed,
  storeStatementPaymentIntent,
} from "@/features/rooms/statement-repository";
import {loadStatementDetail, type StatementDetail} from "@/features/rooms/statements";

export type ChargeOutcome = {
  statement: StatementDetail["statement"];
  status: StatementDetail["statement"]["status"];
  changed: boolean;
};

function requireChargeActor(input: {actor?: User; system?: boolean}): void {
  if (!input.system && (!input.actor || !canAdminister(input.actor))) {
    throw new RoomError("forbidden");
  }
}

export async function chargeStatement(input: {
  actor?: User;
  system?: boolean;
  statementId: string;
}): Promise<ChargeOutcome> {
  requireChargeActor(input);

  const current = await findStatementById(input.statementId);
  if (!current) {
    throw new RoomError("notFound");
  }
  if (current.status === "OPEN") {
    throw new RoomError("statementNotChargeable");
  }
  if (current.status === "PAID") {
    const detail = await loadStatementDetail({
      actor: input.actor,
      system: input.system,
      statementId: current.id,
    });
    return {statement: detail.statement, status: detail.statement.status, changed: false};
  }
  if (current.status === "PAYMENT_PENDING") {
    if (input.system) {
      return {statement: current, status: "PAYMENT_PENDING", changed: false};
    }
    throw new RoomError("alreadyCharging");
  }

  const claimed = await claimStatementForCharge(current.id);
  if (!claimed) {
    throw new RoomError("notFound");
  }
  if (claimed.statement.status === "PAID") {
    const detail = await loadStatementDetail({
      actor: input.actor,
      system: input.system,
      statementId: claimed.statement.id,
    });
    return {statement: detail.statement, status: "PAID", changed: false};
  }
  if (!claimed.claimed) {
    throw new RoomError(claimed.statement.status === "PAYMENT_PENDING" ? "alreadyCharging" : "statementNotChargeable");
  }

  const pending = claimed.statement;
  const amountMinor = pending.totalMinor;
  if (amountMinor <= 0) {
    const paid = await markStatementPaid({statementId: pending.id});
    const statement = paid ?? pending;
    await recordAudit({
      actorUserId: input.actor?.id ?? null,
      targetUserId: statement.userId,
      action: AUDIT_ACTIONS.ROOM_STATEMENT_PAID,
      before: {status: current.status, totalMinor: current.totalMinor},
      after: {statementId: statement.id, status: "PAID", totalMinor: statement.totalMinor},
    });
    const detail = await loadStatementDetail({
      actor: input.actor,
      system: true,
      statementId: statement.id,
    });
    await notifyPaymentSucceeded(detail);
    return {statement: detail.statement, status: "PAID", changed: true};
  }

  const owner = await findUserById(pending.userId);
  if (!owner) {
    throw new RoomError("notFound");
  }
  const method = paymentMethodFromUser(owner);
  if (!method?.stripeCustomerId || !method.stripePaymentMethodId) {
    const failed = await markStatementPaymentFailed({
      statementId: pending.id,
      failureCode: "missing_payment_method",
    });
    const statement = failed ?? pending;
    await recordAudit({
      actorUserId: input.actor?.id ?? null,
      targetUserId: statement.userId,
      action: AUDIT_ACTIONS.ROOM_STATEMENT_PAYMENT_FAILED,
      before: {status: "PAYMENT_PENDING"},
      after: {statementId: statement.id, status: "PAYMENT_FAILED", failureCode: "missing_payment_method"},
    });
    const detail = await loadStatementDetail({
      actor: input.actor,
      system: true,
      statementId: statement.id,
    });
    await notifyPaymentFailed(detail);
    if (!input.system) {
      throw new RoomError("paymentMethodRequired");
    }
    return {statement: detail.statement, status: "PAYMENT_FAILED", changed: true};
  }

  await recordAudit({
    actorUserId: input.actor?.id ?? null,
    targetUserId: pending.userId,
    action: AUDIT_ACTIONS.ROOM_STATEMENT_CHARGE_STARTED,
    after: {
      statementId: pending.id,
      totalMinor: amountMinor,
      attempt: pending.chargeAttempt,
    },
  });

  const adapter = getBillingPaymentAdapter();
  const result = await adapter.chargeStatement({
    statementId: pending.id,
    userId: pending.userId,
    amountMinor,
    currency: pending.currency,
    customerId: method.stripeCustomerId,
    paymentMethodId: method.stripePaymentMethodId,
    idempotencyKey: pending.chargeIdempotencyKey ?? `room_statement_charge_${pending.id}`,
    paymentMethodLast4: method.last4,
  });

  if (result.providerReference) {
    await storeStatementPaymentIntent({
      statementId: pending.id,
      providerReference: result.providerReference,
    });
  }

  if (result.status === "pending") {
    const waiting = (await findStatementById(pending.id)) ?? pending;
    return {statement: waiting, status: "PAYMENT_PENDING", changed: true};
  }

  if (result.status === "succeeded") {
    return applyStatementPaymentEvent({
      statementId: pending.id,
      type: "succeeded",
      providerReference: result.providerReference,
      actor: input.actor,
    });
  }

  return applyStatementPaymentEvent({
    statementId: pending.id,
    type: "failed",
    providerReference: result.providerReference,
    failureCode: result.failureCode,
    actor: input.actor,
  });
}

export async function applyStatementPaymentEvent(input: {
  statementId?: string;
  paymentIntentId?: string;
  type: "succeeded" | "failed";
  providerReference?: string | null;
  failureCode?: string | null;
  actor?: User;
}): Promise<ChargeOutcome> {
  const statement =
    (input.statementId ? await findStatementById(input.statementId) : undefined) ??
    (input.paymentIntentId ? await findStatementByPaymentIntent(input.paymentIntentId) : undefined);
  if (!statement) {
    throw new RoomError("notFound");
  }

  assertNoPrivateNoteMaterial({
    statementId: statement.id,
    status: statement.status,
    totalMinor: statement.totalMinor,
    type: input.type,
  });

  if (input.type === "succeeded") {
    if (statement.status === "PAID") {
      return {statement, status: "PAID", changed: false};
    }
    const paid = await markStatementPaid({
      statementId: statement.id,
      providerReference: input.providerReference,
    });
    const next = paid ?? (await findStatementById(statement.id)) ?? statement;
    if (paid) {
      await recordAudit({
        actorUserId: input.actor?.id ?? null,
        targetUserId: next.userId,
        action: AUDIT_ACTIONS.ROOM_STATEMENT_PAID,
        before: {status: statement.status, totalMinor: statement.totalMinor},
        after: {
          statementId: next.id,
          status: "PAID",
          totalMinor: next.totalMinor,
          providerReference: input.providerReference ?? null,
        },
      });
      const detail = await loadStatementDetail({system: true, statementId: next.id});
      await notifyPaymentSucceeded(detail);
    }
    return {statement: next, status: next.status, changed: Boolean(paid)};
  }

  if (statement.status === "PAID") {
    return {statement, status: "PAID", changed: false};
  }

  const failed = await markStatementPaymentFailed({
    statementId: statement.id,
    failureCode: input.failureCode ?? "payment_failed",
    providerReference: input.providerReference,
  });
  const next = failed ?? (await findStatementById(statement.id)) ?? statement;
  if (failed) {
    await recordAudit({
      actorUserId: input.actor?.id ?? null,
      targetUserId: next.userId,
      action: AUDIT_ACTIONS.ROOM_STATEMENT_PAYMENT_FAILED,
      before: {status: statement.status},
      after: {
        statementId: next.id,
        status: "PAYMENT_FAILED",
        failureCode: next.failureCode,
      },
    });
    const detail = await loadStatementDetail({system: true, statementId: next.id});
    await notifyPaymentFailed(detail);
  }
  return {statement: next, status: next.status, changed: Boolean(failed)};
}
