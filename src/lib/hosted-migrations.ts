type HostedBuildEnvironment = Readonly<
  Record<string, string | undefined>
>;

/** Production Vercel builds apply committed SQL. Previews and local `pnpm build` do not. */
export function shouldApplyHostedMigrations(
  environment: HostedBuildEnvironment = process.env,
): boolean {
  return environment.VERCEL_ENV === "production";
}
