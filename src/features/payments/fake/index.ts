import {createHmac, timingSafeEqual} from "node:crypto";

import {hasLocale} from "next-intl";

import {localizedPathname} from "@/i18n/path";
import {routing} from "@/i18n/routing";

import type {CreateCheckoutInput, CheckoutResult, PaymentProvider} from "../types";

function signingSecret(): string {
  return (
    process.env.FAKE_PAYMENT_SECRET ||
    process.env.DATABASE_URL ||
    "mhp-fake-payment-local-secret"
  );
}

export function signFakeCheckoutToken(bookingId: string): string {
  return createHmac("sha256", signingSecret())
    .update(bookingId)
    .digest("hex");
}

export function isValidFakeCheckoutToken(
  bookingId: string,
  token: string,
): boolean {
  const expected = Buffer.from(signFakeCheckoutToken(bookingId));
  const received = Buffer.from(token);

  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
}

export class FakePaymentProvider implements PaymentProvider {
  readonly name = "fake" as const;

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const token = signFakeCheckoutToken(input.bookingId);
    const locale = hasLocale(routing.locales, input.locale)
      ? input.locale
      : routing.defaultLocale;
    const pathname = localizedPathname(locale, "/booking/fake-checkout");
    const url = `${pathname}?bookingId=${encodeURIComponent(input.bookingId)}&token=${encodeURIComponent(token)}`;

    return {
      url,
      reference: token,
    };
  }
}
