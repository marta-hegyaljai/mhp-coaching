import type Stripe from "stripe";
import {describe, expect, it} from "vitest";

import {isRoomPaymentMethodSetupEvent} from "./billing-setup";

function sessionEvent(
  input: Partial<Stripe.Checkout.Session> & {mode?: Stripe.Checkout.Session.Mode},
): Stripe.Event {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_1",
        mode: input.mode ?? "setup",
        metadata: input.metadata ?? {purpose: "room_payment_method", userId: "user-1"},
      },
    },
  } as unknown as Stripe.Event;
}

describe("room payment-method setup events", () => {
  it("accepts only Checkout setup sessions tagged for room billing", () => {
    expect(isRoomPaymentMethodSetupEvent(sessionEvent({}))).toBe(true);
    expect(
      isRoomPaymentMethodSetupEvent(
        sessionEvent({mode: "payment", metadata: {bookingId: "booking-1"}}),
      ),
    ).toBe(false);
    expect(
      isRoomPaymentMethodSetupEvent({
        type: "checkout.session.expired",
        data: {object: {mode: "setup", metadata: {purpose: "room_payment_method"}}},
      } as unknown as Stripe.Event),
    ).toBe(false);
  });
});
