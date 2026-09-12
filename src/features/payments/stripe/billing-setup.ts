import Stripe from "stripe";

import type {
  BillingPaymentAdapter,
  BillingSetupSession,
  ChargeResult,
  ChargeStatementInput,
  CreateBillingSetupInput,
  SavedPaymentMethod,
} from "../billing-method";
import {assertStripeCredentialsAllowed} from "./env";

const checkoutLocales = {
  fr: "fr",
  de: "de",
  en: "en",
} as const;

function getStripe(): Stripe {
  assertStripeCredentialsAllowed();
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

  async chargeStatement(input: ChargeStatementInput): Promise<ChargeResult> {
    const stripe = getStripe();
    try {
      const intent = await stripe.paymentIntents.create(
        {
          amount: input.amountMinor,
          currency: input.currency.toLowerCase(),
          customer: input.customerId,
          payment_method: input.paymentMethodId,
          off_session: true,
          confirm: true,
          metadata: {
            purpose: "room_statement",
            statementId: input.statementId,
            userId: input.userId,
          },
        },
        {idempotencyKey: input.idempotencyKey},
      );
      return chargeResultFromPaymentIntent(intent);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeCardError) {
        const intent = error.payment_intent;
        return {
          status: "failed",
          providerReference: typeof intent === "object" && intent ? intent.id : null,
          failureCode: error.code ?? "card_declined",
        };
      }
      throw error;
    }
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

export function chargeResultFromPaymentIntent(intent: Stripe.PaymentIntent): ChargeResult {
  if (intent.status === "succeeded") {
    return {status: "succeeded", providerReference: intent.id};
  }
  if (intent.status === "requires_payment_method" || intent.status === "canceled") {
    return {
      status: "failed",
      providerReference: intent.id,
      failureCode: intent.last_payment_error?.code ?? "payment_failed",
    };
  }
  return {status: "pending", providerReference: intent.id};
}

export function isRoomStatementPaymentEvent(event: Stripe.Event): boolean {
  if (event.type !== "payment_intent.succeeded" && event.type !== "payment_intent.payment_failed") {
    return false;
  }
  const intent = event.data.object as Stripe.PaymentIntent;
  return intent.metadata?.purpose === "room_statement" && Boolean(intent.metadata?.statementId);
}

export function roomStatementChargeFromEvent(event: Stripe.Event): {
  statementId: string;
  type: "succeeded" | "failed";
  providerReference: string;
  failureCode: string | null;
} | null {
  if (!isRoomStatementPaymentEvent(event)) {
    return null;
  }
  const intent = event.data.object as Stripe.PaymentIntent;
  const statementId = intent.metadata?.statementId;
  if (!statementId) {
    return null;
  }
  return {
    statementId,
    type: event.type === "payment_intent.succeeded" ? "succeeded" : "failed",
    providerReference: intent.id,
    failureCode:
      event.type === "payment_intent.payment_failed"
        ? intent.last_payment_error?.code ?? "payment_failed"
        : null,
  };
}
