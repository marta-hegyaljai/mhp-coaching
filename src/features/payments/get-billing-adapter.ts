import {FakeBillingPaymentAdapter} from "./fake/billing-setup";
import {StripeBillingPaymentAdapter} from "./stripe/billing-setup";
import type {BillingPaymentAdapter} from "./billing-method";
import {getConfiguredPaymentProviderName} from "./types";

export function getBillingPaymentAdapter(): BillingPaymentAdapter {
  if (getConfiguredPaymentProviderName() === "stripe") {
    return new StripeBillingPaymentAdapter();
  }
  return new FakeBillingPaymentAdapter();
}
