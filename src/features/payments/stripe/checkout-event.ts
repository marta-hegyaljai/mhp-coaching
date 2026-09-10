import type Stripe from "stripe";

export type CheckoutFulfillment = "paid" | "failed" | "cancelled" | "ignored";

export function checkoutFulfillment(event: Stripe.Event): CheckoutFulfillment {
  if (event.type === "checkout.session.async_payment_succeeded") {
    return "paid";
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    return session.payment_status === "paid" ? "paid" : "ignored";
  }

  if (event.type === "checkout.session.async_payment_failed") {
    return "failed";
  }

  if (event.type === "checkout.session.expired") {
    return "cancelled";
  }

  return "ignored";
}
