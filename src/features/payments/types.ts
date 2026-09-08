export type PaymentProviderName = "fake" | "stripe";

export type CreateCheckoutInput = {
  bookingId: string;
  amountMinor: number;
  currency: string;
  customerEmail: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  locale: string;
};

export type CheckoutResult = {
  url: string;
  reference: string;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>;
}

export function getConfiguredPaymentProviderName(): PaymentProviderName {
  return process.env.PAYMENT_PROVIDER === "stripe" ? "stripe" : "fake";
}
