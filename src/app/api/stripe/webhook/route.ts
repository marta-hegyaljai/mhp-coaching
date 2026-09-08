import {NextResponse} from "next/server";

import {applyPaymentEvent} from "@/features/payments/apply-event";
import {
  bookingIdFromStripeEvent,
  constructStripeEvent,
} from "@/features/payments/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  try {
    const event = constructStripeEvent(body, signature);
    const bookingId = bookingIdFromStripeEvent(event);

    if (!bookingId) {
      return NextResponse.json({received: true, ignored: true});
    }

    if (
      event.type !== "checkout.session.completed" &&
      event.type !== "checkout.session.async_payment_succeeded" &&
      event.type !== "checkout.session.expired" &&
      event.type !== "checkout.session.async_payment_failed"
    ) {
      return NextResponse.json({received: true});
    }

    const type =
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
        ? "paid"
        : event.type === "checkout.session.async_payment_failed"
          ? "failed"
          : "cancelled";

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

    return NextResponse.json({received: true});
  } catch (error) {
    console.error("Stripe webhook rejected", error);
    return NextResponse.json({error: "invalid_signature"}, {status: 400});
  }
}
