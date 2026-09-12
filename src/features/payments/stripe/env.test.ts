import {describe, expect, it} from "vitest";

import {assertStripeCredentialsAllowed, isStripeLiveMode} from "./env";

describe("Stripe credential guard", () => {
  it("rejects live keys outside Vercel production", () => {
    expect(isStripeLiveMode({STRIPE_SECRET_KEY: "sk_live_abc"})).toBe(true);
    expect(() =>
      assertStripeCredentialsAllowed({
        STRIPE_SECRET_KEY: "sk_live_abc",
        VERCEL_ENV: "preview",
      }),
    ).toThrow(/live credentials/);
    expect(() =>
      assertStripeCredentialsAllowed({
        STRIPE_SECRET_KEY: "sk_test_abc",
        VERCEL_ENV: "preview",
      }),
    ).not.toThrow();
    expect(() =>
      assertStripeCredentialsAllowed({
        STRIPE_SECRET_KEY: "sk_live_abc",
        VERCEL_ENV: "production",
      }),
    ).not.toThrow();
  });
});
