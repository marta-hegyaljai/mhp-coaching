import type Stripe from "stripe";
import {describe, expect, it} from "vitest";

import {isHostedPreviewMailBlocked} from "@/features/email/preview";
import {
  isRoomPaymentMethodSetupEvent,
  isRoomStatementPaymentEvent,
  roomStatementChargeFromEvent,
} from "@/features/payments/stripe/billing-setup";

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

function paymentIntentEvent(
  type: "payment_intent.succeeded" | "payment_intent.payment_failed",
  metadata: Record<string, string>,
): Stripe.Event {
  return {
    type,
    data: {
      object: {
        id: "pi_test_1",
        metadata,
        last_payment_error: type === "payment_intent.payment_failed" ? {code: "card_declined"} : null,
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

describe("room statement PaymentIntent events", () => {
  it("accepts only statement-tagged PaymentIntents and ignores course checkout", () => {
    expect(
      isRoomStatementPaymentEvent(
        paymentIntentEvent("payment_intent.succeeded", {
          purpose: "room_statement",
          statementId: "stmt-1",
        }),
      ),
    ).toBe(true);
    expect(
      isRoomStatementPaymentEvent(
        paymentIntentEvent("payment_intent.succeeded", {bookingId: "booking-1"}),
      ),
    ).toBe(false);
    expect(isRoomStatementPaymentEvent(sessionEvent({}))).toBe(false);

    const failed = roomStatementChargeFromEvent(
      paymentIntentEvent("payment_intent.payment_failed", {
        purpose: "room_statement",
        statementId: "stmt-1",
      }),
    );
    expect(failed).toEqual({
      statementId: "stmt-1",
      type: "failed",
      providerReference: "pi_test_1",
      failureCode: "card_declined",
    });
  });
});

describe("preview mail blocking", () => {
  it("blocks real recipients only in hosted preview", () => {
    expect(isHostedPreviewMailBlocked({})).toBe(false);
    expect(isHostedPreviewMailBlocked({VERCEL_ENV: "production"})).toBe(false);
    expect(isHostedPreviewMailBlocked({VERCEL_ENV: "preview"})).toBe(true);
  });
});
