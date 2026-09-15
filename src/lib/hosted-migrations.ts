type HostedBuildEnvironment = Readonly<
  Record<string, string | undefined>
>;

/** Vercel production and preview builds apply committed SQL to Neon.
 *  drizzle-kit migrate wraps pending files in one transaction; see ARCHITECTURE.md. */
export function shouldApplyHostedMigrations(
  environment: HostedBuildEnvironment = process.env,
): boolean {
  return (
    environment.VERCEL_ENV === "production" ||
    environment.VERCEL_ENV === "preview"
  );
}

/** Catalogue re-seed stays production-only so previews do not rewrite go-live rows. */
export function shouldSeedHostedCatalogue(
  environment: HostedBuildEnvironment = process.env,
): boolean {
  return environment.VERCEL_ENV === "production";
}
