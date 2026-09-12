import {afterEach, describe, expect, it} from "vitest";

import {POST} from "@/app/api/stripe/webhook/route";

describe("Stripe webhook route", () => {
  const previousSecret = process.env.STRIPE_SECRET_KEY;
  const previousWebhook = process.env.STRIPE_WEBHOOK_SECRET;
  const previousVercel = process.env.VERCEL_ENV;

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = previousSecret;
    process.env.STRIPE_WEBHOOK_SECRET = previousWebhook;
    process.env.VERCEL_ENV = previousVercel;
  });

  it("rejects unsigned bodies without marking anything paid", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_cp10_webhook";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_cp10_webhook";
    process.env.VERCEL_ENV = "production";

    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          type: "payment_intent.succeeded",
          data: {object: {id: "pi_unsigned", metadata: {purpose: "room_statement"}}},
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({error: "invalid_signature"});
  });
});
