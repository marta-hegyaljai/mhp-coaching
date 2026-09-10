type HostedBuildEnvironment = Readonly<
  Record<string, string | undefined>
>;

/** Vercel production and preview builds apply committed SQL to Neon. */
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
