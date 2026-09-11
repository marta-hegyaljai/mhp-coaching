import {NextResponse} from "next/server";

import {applyPaymentEvent} from "@/features/payments/apply-event";
import {checkoutFulfillment} from "@/features/payments/stripe/checkout-event";
import {
  bookingIdFromStripeEvent,
  constructStripeEvent,
} from "@/features/payments/stripe";
import {
  isRoomPaymentMethodSetupEvent,
  isRoomStatementPaymentEvent,
  paymentMethodFromSetupSession,
  roomStatementChargeFromEvent,
} from "@/features/payments/stripe/billing-setup";
import {applyStripePaymentMethodSetup} from "@/features/rooms/payment-method";
import {applyStatementPaymentEvent} from "@/features/rooms/charging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  try {
    const event = constructStripeEvent(body, signature);

    if (isRoomPaymentMethodSetupEvent(event)) {
      const session = event.data.object as {id?: string};
      if (!session.id) {
        return NextResponse.json({received: true, ignored: true});
      }
      const setup = await paymentMethodFromSetupSession(session.id);
      if (!setup) {
        return NextResponse.json({received: true, ignored: true});
      }
      await applyStripePaymentMethodSetup({
        userId: setup.userId,
        method: setup.method,
      });
      return NextResponse.json({received: true, billingSetup: true});
    }

    if (isRoomStatementPaymentEvent(event)) {
      const charge = roomStatementChargeFromEvent(event);
      if (!charge) {
        return NextResponse.json({received: true, ignored: true});
      }
      await applyStatementPaymentEvent({
        statementId: charge.statementId,
        paymentIntentId: charge.providerReference,
        type: charge.type,
        providerReference: charge.providerReference,
        failureCode: charge.failureCode,
      });
      return NextResponse.json({received: true, roomStatement: true});
    }

    const bookingId = bookingIdFromStripeEvent(event);

    if (!bookingId) {
      return NextResponse.json({received: true, ignored: true});
    }

    const type = checkoutFulfillment(event);

    if (type === "ignored") {
      return NextResponse.json({received: true, pending: true});
    }

    const result = await applyPaymentEvent({
      bookingId,
      provider: "stripe",
      providerEventId: event.id,
      type,
      payload: {type: event.type},
    });

    if (!result.ok) {
      return NextResponse.json({error: result.reason}, {status: 400});
    }

    if (type === "paid" && result.confirmationEmailSent === false) {
      return NextResponse.json(
        {error: "confirmation_email_failed"},
        {status: 500},
      );
    }

    return NextResponse.json({received: true});
  } catch (error) {
    console.error("Stripe webhook rejected", error);
    return NextResponse.json({error: "invalid_signature"}, {status: 400});
  }
}
