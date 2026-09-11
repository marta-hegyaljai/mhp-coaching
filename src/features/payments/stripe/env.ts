/**
 * Live Stripe credentials belong only on Vercel production. Local, preview and
 * test environments must use test-mode keys or the fake provider.
 */
export function assertStripeCredentialsAllowed(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): void {
  const secretKey = environment.STRIPE_SECRET_KEY ?? "";
  if (secretKey.startsWith("sk_live_") && environment.VERCEL_ENV !== "production") {
    throw new Error("Stripe live credentials are only allowed in Vercel production");
  }
}

export function isStripeLiveMode(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return (environment.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_");
}
