import {FakePaymentProvider} from "./fake";
import {StripePaymentProvider} from "./stripe";
import {
  getConfiguredPaymentProviderName,
  type PaymentProvider,
} from "./types";

export function getPaymentProvider(): PaymentProvider {
  if (getConfiguredPaymentProviderName() === "stripe") {
    return new StripePaymentProvider();
  }

  return new FakePaymentProvider();
}
