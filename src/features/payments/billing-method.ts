export type SavedPaymentMethod = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  stripeCustomerId: string | null;
  stripePaymentMethodId: string | null;
};

export type CreateBillingSetupInput = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  locale: string;
  existingCustomerId: string | null;
  successUrl: string;
  cancelUrl: string;
};

export type BillingSetupSession = {
  url: string;
  customerId: string | null;
  reference: string;
};

export type ChargeStatementInput = {
  statementId: string;
  userId: string;
  amountMinor: number;
  currency: string;
  customerId: string;
  paymentMethodId: string;
  idempotencyKey: string;
  paymentMethodLast4?: string | null;
};

export type ChargeResult =
  | {status: "succeeded"; providerReference: string}
  | {status: "pending"; providerReference: string}
  | {status: "failed"; providerReference: string | null; failureCode: string};

export interface BillingPaymentAdapter {
  readonly name: "fake" | "stripe";
  createSetupSession(input: CreateBillingSetupInput): Promise<BillingSetupSession>;
  chargeStatement(input: ChargeStatementInput): Promise<ChargeResult>;
}

export function paymentMethodFromUser(user: {
  paymentMethodBrand: string | null;
  paymentMethodLast4: string | null;
  paymentMethodExpMonth: number | null;
  paymentMethodExpYear: number | null;
  stripeCustomerId: string | null;
  stripePaymentMethodId: string | null;
}): SavedPaymentMethod | null {
  if (
    !user.paymentMethodBrand ||
    !user.paymentMethodLast4 ||
    user.paymentMethodExpMonth == null ||
    user.paymentMethodExpYear == null
  ) {
    return null;
  }

  return {
    brand: user.paymentMethodBrand,
    last4: user.paymentMethodLast4,
    expMonth: user.paymentMethodExpMonth,
    expYear: user.paymentMethodExpYear,
    stripeCustomerId: user.stripeCustomerId,
    stripePaymentMethodId: user.stripePaymentMethodId,
  };
}

export function formatPaymentMethodLabel(method: SavedPaymentMethod): string {
  const brand = method.brand.trim() || "card";
  const titled = brand.charAt(0).toUpperCase() + brand.slice(1);
  const month = String(method.expMonth).padStart(2, "0");
  return `${titled} •••• ${method.last4} · ${month}/${method.expYear}`;
}

export function assertPaymentMethodDisplay(method: SavedPaymentMethod): void {
  if (!/^[0-9]{4}$/.test(method.last4)) {
    throw new Error("invalidPaymentMethod");
  }
  if (!Number.isInteger(method.expMonth) || method.expMonth < 1 || method.expMonth > 12) {
    throw new Error("invalidPaymentMethod");
  }
  if (!Number.isInteger(method.expYear) || method.expYear < 2000) {
    throw new Error("invalidPaymentMethod");
  }
}
