import type {User} from "@/db/schema";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {canAccessRooms, canAdminister} from "@/features/auth/policy";
import {findUserById, recordAudit, updateUser} from "@/features/auth/repository";
import {getBillingPaymentAdapter} from "@/features/payments/get-billing-adapter";
import {
  assertPaymentMethodDisplay,
  formatPaymentMethodLabel,
  paymentMethodFromUser,
  type SavedPaymentMethod,
} from "@/features/payments/billing-method";
import {getConfiguredPaymentProviderName} from "@/features/payments/types";
import {FAKE_CARD} from "@/features/payments/fake/billing-setup";
import {RoomError} from "@/features/rooms/errors";
import {getSiteUrl} from "@/lib/site-url";
import {localizedPathname} from "@/i18n/path";
import type {AppLocale} from "@/i18n/routing";

function requireSelfOrAdmin(actor: User, userId: string): void {
  if (actor.id !== userId && !canAdminister(actor)) {
    throw new RoomError("forbidden");
  }
  if (!canAccessRooms(actor) && !canAdminister(actor)) {
    throw new RoomError("forbidden");
  }
}

export function savedPaymentMethodFor(user: User): SavedPaymentMethod | null {
  return paymentMethodFromUser(user);
}

export async function savePaymentMethodDisplay(input: {
  actor: User;
  userId: string;
  method: SavedPaymentMethod;
}): Promise<User> {
  requireSelfOrAdmin(input.actor, input.userId);
  assertPaymentMethodDisplay(input.method);

  const target = await findUserById(input.userId);
  if (!target) {
    throw new RoomError("notFound");
  }

  const before = paymentMethodFromUser(target);
  const updated = await updateUser(target.id, {
    stripeCustomerId: input.method.stripeCustomerId,
    stripePaymentMethodId: input.method.stripePaymentMethodId,
    paymentMethodBrand: input.method.brand.toLowerCase(),
    paymentMethodLast4: input.method.last4,
    paymentMethodExpMonth: input.method.expMonth,
    paymentMethodExpYear: input.method.expYear,
  });

  await recordAudit({
    actorUserId: input.actor.id,
    targetUserId: target.id,
    action: AUDIT_ACTIONS.ROOM_PAYMENT_METHOD_CHANGED,
    before: before
      ? {
          brand: before.brand,
          last4: before.last4,
          expMonth: before.expMonth,
          expYear: before.expYear,
        }
      : null,
    after: {
      brand: updated.paymentMethodBrand,
      last4: updated.paymentMethodLast4,
      expMonth: updated.paymentMethodExpMonth,
      expYear: updated.paymentMethodExpYear,
    },
  });

  return updated;
}

export async function startPaymentMethodSetup(input: {
  actor: User;
  locale: AppLocale;
}): Promise<{url: string}> {
  if (!canAccessRooms(input.actor) && !canAdminister(input.actor)) {
    throw new RoomError("forbidden");
  }

  const origin = getSiteUrl().origin;
  const successPath = localizedPathname(input.locale, "/billing/payment-method/return");
  const cancelPath = localizedPathname(input.locale, "/billing");
  const adapter = getBillingPaymentAdapter();

  try {
    const session = await adapter.createSetupSession({
      userId: input.actor.id,
      email: input.actor.email,
      firstName: input.actor.firstName,
      lastName: input.actor.lastName,
      locale: input.locale,
      existingCustomerId: input.actor.stripeCustomerId,
      successUrl: `${origin}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}${cancelPath}`,
    });

    if (
      session.customerId &&
      session.customerId !== input.actor.stripeCustomerId &&
      getConfiguredPaymentProviderName() === "stripe"
    ) {
      await updateUser(input.actor.id, {stripeCustomerId: session.customerId});
    }

    return {url: session.url};
  } catch (error) {
    console.error(error);
    throw new RoomError("paymentSetupFailed");
  }
}

export async function completeFakePaymentMethod(input: {
  actor: User;
  userId: string;
}): Promise<User> {
  if (getConfiguredPaymentProviderName() !== "fake") {
    throw new RoomError("notFound");
  }
  requireSelfOrAdmin(input.actor, input.userId);

  return savePaymentMethodDisplay({
    actor: input.actor,
    userId: input.userId,
    method: {
      ...FAKE_CARD,
      stripeCustomerId: `cus_fake_${input.userId}`,
      stripePaymentMethodId: `pm_fake_${input.userId}`,
    },
  });
}

export async function applyStripePaymentMethodSetup(input: {
  userId: string;
  method: SavedPaymentMethod;
}): Promise<User> {
  const user = await findUserById(input.userId);
  if (!user) {
    throw new RoomError("notFound");
  }
  return savePaymentMethodDisplay({
    actor: user,
    userId: user.id,
    method: input.method,
  });
}

export function paymentMethodAuditSafe(method: SavedPaymentMethod | null) {
  if (!method) {
    return null;
  }
  return {
    brand: method.brand,
    last4: method.last4,
    label: formatPaymentMethodLabel(method),
  };
}
