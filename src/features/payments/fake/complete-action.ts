"use server";

import {redirect} from "next/navigation";

import {applyPaymentEvent} from "@/features/payments/apply-event";
import {isValidFakeCheckoutToken} from "@/features/payments/fake";
import {localizedPathname} from "@/i18n/path";
import {hasLocale} from "next-intl";
import {routing, type AppLocale} from "@/i18n/routing";

export async function completeFakePaymentAction(formData: FormData): Promise<void> {
  const bookingId = String(formData.get("bookingId") ?? "");
  const token = String(formData.get("token") ?? "");
  const localeValue = String(formData.get("locale") ?? "fr");
  const locale: AppLocale = hasLocale(routing.locales, localeValue)
    ? localeValue
    : "fr";
  const intent = String(formData.get("intent") ?? "pay");

  if (!bookingId || !isValidFakeCheckoutToken(bookingId, token)) {
    throw new Error("Invalid fake checkout token");
  }

  if (intent === "pay") {
    const result = await applyPaymentEvent({
      bookingId,
      provider: "fake",
      providerEventId: `fake-pay-${bookingId}`,
      type: "paid",
      payload: {source: "fake-checkout"},
    });

    if (!result.ok) {
      throw new Error(result.reason);
    }
  } else {
    await applyPaymentEvent({
      bookingId,
      provider: "fake",
      providerEventId: `fake-cancel-${bookingId}`,
      type: "cancelled",
      payload: {source: "fake-checkout"},
    });
  }

  const pathname = localizedPathname(
    locale,
    intent === "pay" ? "/booking/success" : "/booking/cancelled",
  );

  redirect(`${pathname}?bookingId=${encodeURIComponent(bookingId)}`);
}
