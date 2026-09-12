"use server";

import {hasLocale} from "next-intl";
import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";

import {canAdminister} from "@/features/auth/policy";
import {readSessionUser} from "@/features/auth/session";
import {RoomError} from "@/features/rooms/errors";
import {
  completeFakePaymentMethod,
  startPaymentMethodSetup,
} from "@/features/rooms/payment-method";
import {addStatementAdjustment, finalizeUserMonth} from "@/features/rooms/statements";
import {chargeStatement} from "@/features/rooms/charging";
import {notifyStatementFinalized} from "@/features/rooms/notifications";
import {isValidFakeBillingSetupToken} from "@/features/payments/fake/billing-setup";
import {localizedPathname} from "@/i18n/path";
import {revalidateLocalized} from "@/i18n/revalidate";
import {routing, type AppLocale} from "@/i18n/routing";

export type BillingFormState = {
  ok?: boolean;
  error?: string;
};

function resolveLocale(locale: string): AppLocale {
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

async function localizeBillingError(error: unknown, locale: AppLocale): Promise<BillingFormState> {
  const t = await getTranslations({locale, namespace: "Rooms.errors"});
  if (error instanceof RoomError) {
    return {error: t(error.code)};
  }
  console.error(error);
  return {error: t("saveFailed")};
}

function revalidateBillingSurfaces(userId?: string): void {
  revalidateLocalized("/billing");
  revalidateLocalized("/admin/billing");
  if (userId) {
    revalidateLocalized({pathname: "/admin/billing/[userId]", params: {userId}});
    revalidateLocalized({pathname: "/admin/users/[id]", params: {id: userId}});
  }
}

export async function startPaymentMethodSetupAction(locale: string): Promise<void> {
  const resolvedLocale = resolveLocale(locale);
  const actor = await readSessionUser();
  if (!actor) {
    throw new RoomError("forbidden");
  }
  const {url} = await startPaymentMethodSetup({actor, locale: resolvedLocale});
  redirect(url);
}

export async function completeFakePaymentMethodAction(formData: FormData): Promise<void> {
  const locale = resolveLocale(String(formData.get("locale") ?? ""));
  const userId = String(formData.get("userId") ?? "");
  const token = String(formData.get("token") ?? "");
  const actor = await readSessionUser();
  if (!actor || !userId || !isValidFakeBillingSetupToken(userId, token)) {
    throw new RoomError("notFound");
  }
  await completeFakePaymentMethod({actor, userId});
  revalidateBillingSurfaces(userId);
  redirect(localizedPathname(locale, "/billing"));
}

export async function finalizeStatementAction(
  locale: string,
  userId: string,
  monthKey: string,
  _previous: BillingFormState | null,
  _formData: FormData,
): Promise<BillingFormState> {
  const resolvedLocale = resolveLocale(locale);
  try {
    const actor = await readSessionUser();
    if (!actor || !canAdminister(actor)) {
      throw new RoomError("forbidden");
    }
    const detail = await finalizeUserMonth({actor, userId, month: monthKey});
    await notifyStatementFinalized(detail);
    revalidateBillingSurfaces(userId);
    revalidateLocalized({
      pathname: "/admin/billing/[userId]/statements/[id]",
      params: {userId, id: detail.statement.id},
    });
    return {ok: true};
  } catch (error) {
    return localizeBillingError(error, resolvedLocale);
  }
}

export async function addStatementAdjustmentAction(
  locale: string,
  statementId: string,
  userId: string,
  _previous: BillingFormState | null,
  formData: FormData,
): Promise<BillingFormState> {
  const resolvedLocale = resolveLocale(locale);
  try {
    const actor = await readSessionUser();
    if (!actor || !canAdminister(actor)) {
      throw new RoomError("forbidden");
    }
    const francs = String(formData.get("amount") ?? "").trim().replace(",", ".");
    const parsed = Number(francs);
    if (!Number.isFinite(parsed)) {
      throw new RoomError("invalidAdjustment");
    }
    const amountMinor = Math.round(parsed * 100);
    await addStatementAdjustment({
      actor,
      statementId,
      amountMinor,
      reason: String(formData.get("reason") ?? ""),
    });
    revalidateBillingSurfaces(userId);
    revalidateLocalized({
      pathname: "/admin/billing/[userId]/statements/[id]",
      params: {userId, id: statementId},
    });
    revalidateLocalized({
      pathname: "/billing/statements/[id]",
      params: {id: statementId},
    });
    return {ok: true};
  } catch (error) {
    return localizeBillingError(error, resolvedLocale);
  }
}

export async function chargeStatementAction(
  locale: string,
  statementId: string,
  userId: string,
  _previous: BillingFormState | null,
  _formData: FormData,
): Promise<BillingFormState> {
  const resolvedLocale = resolveLocale(locale);
  try {
    const actor = await readSessionUser();
    if (!actor || !canAdminister(actor)) {
      throw new RoomError("forbidden");
    }
    await chargeStatement({actor, statementId});
    revalidateBillingSurfaces(userId);
    revalidateLocalized({
      pathname: "/admin/billing/[userId]/statements/[id]",
      params: {userId, id: statementId},
    });
    revalidateLocalized({
      pathname: "/billing/statements/[id]",
      params: {id: statementId},
    });
    return {ok: true};
  } catch (error) {
    return localizeBillingError(error, resolvedLocale);
  }
}
