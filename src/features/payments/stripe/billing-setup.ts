import Stripe from "stripe";

import type {
  BillingPaymentAdapter,
  BillingSetupSession,
  CreateBillingSetupInput,
  SavedPaymentMethod,
} from "../billing-method";

const checkoutLocales = {
  fr: "fr",
  de: "de",
  en: "en",
} as const;

function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || secretKey.includes("replace_me")) {
    throw new Error("STRIPE_SECRET_KEY is not configured for test-mode billing setup");
  }

  return new Stripe(secretKey);
}

function checkoutLocale(locale: string): Stripe.Checkout.SessionCreateParams.Locale {
  return checkoutLocales[locale as keyof typeof checkoutLocales] ?? "auto";
}

export class StripeBillingPaymentAdapter implements BillingPaymentAdapter {
  readonly name = "stripe" as const;

  async createSetupSession(input: CreateBillingSetupInput): Promise<BillingSetupSession> {
    const stripe = getStripe();
    const customerId =
      input.existingCustomerId ??
      (
        await stripe.customers.create({
          email: input.email,
          name: `${input.firstName} ${input.lastName}`.trim(),
          metadata: {userId: input.userId, purpose: "room_billing"},
        })
      ).id;

    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      currency: "chf",
      customer: customerId,
      locale: checkoutLocale(input.locale),
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      payment_method_types: ["card"],
      metadata: {
        purpose: "room_payment_method",
        userId: input.userId,
      },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a billing setup URL");
    }

    return {
      url: session.url,
      customerId,
      reference: session.id,
    };
  }
}

export function isRoomPaymentMethodSetupEvent(event: Stripe.Event): boolean {
  if (event.type !== "checkout.session.completed") {
    return false;
  }
  const session = event.data.object as Stripe.Checkout.Session;
  return session.mode === "setup" && session.metadata?.purpose === "room_payment_method";
}

export async function paymentMethodFromSetupSession(
  sessionId: string,
): Promise<{userId: string; customerId: string; method: SavedPaymentMethod} | null> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["setup_intent.payment_method"],
  });

  if (session.mode !== "setup" || session.metadata?.purpose !== "room_payment_method") {
    return null;
  }

  const userId = session.metadata.userId;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!userId || !customerId) {
    return null;
  }

  const setupIntent =
    typeof session.setup_intent === "object" && session.setup_intent
      ? session.setup_intent
      : session.setup_intent
        ? await stripe.setupIntents.retrieve(session.setup_intent, {expand: ["payment_method"]})
        : null;

  const paymentMethod =
    setupIntent && typeof setupIntent.payment_method === "object"
      ? setupIntent.payment_method
      : null;
  const card = paymentMethod?.card;
  if (!paymentMethod || !card || !card.last4 || card.exp_month == null || card.exp_year == null) {
    return null;
  }

  return {
    userId,
    customerId,
    method: {
      brand: card.brand ?? "card",
      last4: card.last4,
      expMonth: card.exp_month,
      expYear: card.exp_year,
      stripeCustomerId: customerId,
      stripePaymentMethodId: paymentMethod.id,
    },
  };
}
