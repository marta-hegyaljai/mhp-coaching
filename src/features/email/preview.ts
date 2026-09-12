/** Preview deployments must never deliver to real mailboxes. */
export function isHostedPreviewMailBlocked(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return environment.VERCEL_ENV === "preview";
}
