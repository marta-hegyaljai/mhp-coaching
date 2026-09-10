import type Stripe from "stripe";
import {describe, expect, it} from "vitest";

import {checkoutFulfillment} from "./checkout-event";

function checkoutEvent(
  type: Stripe.Event.Type,
  paymentStatus?: Stripe.Checkout.Session.PaymentStatus,
): Stripe.Event {
  return {
    type,
    data: {
      object: {
        payment_status: paymentStatus,
        metadata: {bookingId: "booking-1"},
      },
    },
  } as unknown as Stripe.Event;
}

describe("checkoutFulfillment", () => {
  it("fulfills a completed Checkout session only after Stripe reports it paid", () => {
    expect(
      checkoutFulfillment(checkoutEvent("checkout.session.completed", "paid")),
    ).toBe("paid");
    expect(
      checkoutFulfillment(checkoutEvent("checkout.session.completed", "unpaid")),
    ).toBe("ignored");
  });

  it("fulfills asynchronous success and maps failure and expiry", () => {
    expect(
      checkoutFulfillment(
        checkoutEvent("checkout.session.async_payment_succeeded"),
      ),
    ).toBe("paid");
    expect(
      checkoutFulfillment(
        checkoutEvent("checkout.session.async_payment_failed"),
      ),
    ).toBe("failed");
    expect(
      checkoutFulfillment(checkoutEvent("checkout.session.expired")),
    ).toBe("cancelled");
  });

  it("ignores unrelated Stripe events", () => {
    expect(
      checkoutFulfillment(checkoutEvent("payment_intent.succeeded")),
    ).toBe("ignored");
  });
});
