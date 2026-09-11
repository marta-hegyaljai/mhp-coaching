import {createHmac, timingSafeEqual} from "node:crypto";

import {hasLocale} from "next-intl";

import {getDatabaseUrl} from "@/lib/database-url";
import {localizedPathname} from "@/i18n/path";
import {routing} from "@/i18n/routing";

import type {BillingPaymentAdapter, BillingSetupSession, CreateBillingSetupInput} from "../billing-method";

function signingSecret(): string {
  return (
    process.env.FAKE_PAYMENT_SECRET ||
    getDatabaseUrl() ||
    "mhp-fake-payment-local-secret"
  );
}

export function signFakeBillingSetupToken(userId: string): string {
  return createHmac("sha256", signingSecret()).update(`billing-setup:${userId}`).digest("hex");
}

export function isValidFakeBillingSetupToken(userId: string, token: string): boolean {
  const expected = Buffer.from(signFakeBillingSetupToken(userId));
  const received = Buffer.from(token);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export const FAKE_CARD: {
  brand: "visa";
  last4: "4242";
  expMonth: 12;
  expYear: 2030;
} = {
  brand: "visa",
  last4: "4242",
  expMonth: 12,
  expYear: 2030,
};

export class FakeBillingPaymentAdapter implements BillingPaymentAdapter {
  readonly name = "fake" as const;

  async createSetupSession(input: CreateBillingSetupInput): Promise<BillingSetupSession> {
    const locale = hasLocale(routing.locales, input.locale)
      ? input.locale
      : routing.defaultLocale;
    const token = signFakeBillingSetupToken(input.userId);
    const pathname = localizedPathname(locale, "/billing/setup");
    const url = `${pathname}?userId=${encodeURIComponent(input.userId)}&token=${encodeURIComponent(token)}`;

    return {
      url,
      customerId: input.existingCustomerId ?? `cus_fake_${input.userId}`,
      reference: token,
    };
  }
}
