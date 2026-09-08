import Stripe from "stripe";

import type {CreateCheckoutInput, CheckoutResult, PaymentProvider} from "../types";

function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || secretKey.includes("replace_me")) {
    throw new Error("STRIPE_SECRET_KEY is not configured for test-mode checkout");
  }

  return new Stripe(secretKey);
}

export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe" as const;

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: input.currency.toLowerCase(),
      customer_email: input.customerEmail,
      client_reference_id: input.bookingId,
      payment_method_types: ["card", "twint"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.amountMinor,
            product_data: {
              name: input.description,
            },
          },
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        bookingId: input.bookingId,
      },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return {
      url: session.url,
      reference: session.id,
    };
  }
}

export function constructStripeEvent(
  body: string,
  signature: string | null,
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripe();

  if (!webhookSecret || webhookSecret.includes("replace_me")) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  if (!signature) {
    throw new Error("Missing Stripe signature");
  }

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

export function bookingIdFromStripeEvent(event: Stripe.Event): string | undefined {
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    return session.metadata?.bookingId ?? session.client_reference_id ?? undefined;
  }

  return undefined;
}
